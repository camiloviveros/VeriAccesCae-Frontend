// src/app/user/create-qr/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { accessService } from '../../../../lib/api';
import { Button } from '../../../../components/ui/Button';
import { Alert, AlertTitle } from '../../../../components/ui/Alert';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';

export default function CreateQRPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    id_number: '',
    phone: '',
    email: '',
    company: '',
    visitor_type: 'regular',
    purpose: 'Visita',
    valid_from: '',
    valid_to: '',
  });
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [accessId, setAccessId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Initialize dates
    const now = new Date();
    const inOneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    setFormData(prev => ({
      ...prev,
      valid_from: now.toISOString().slice(0, 16),
      valid_to: inOneDay.toISOString().slice(0, 16)
    }));
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // First create the visitor
      const visitorData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        id_number: formData.id_number,
        phone: formData.phone,
        email: formData.email,
        company: formData.company,
        visitor_type: formData.visitor_type,
        status: 'pending'
      };
      
      const visitorResponse = await accessService.createVisitor(visitorData);
      
      // Then create access with QR
      const accessData = {
        visitor: visitorResponse.id,
        purpose: formData.purpose,
        valid_from: formData.valid_from,
        valid_to: formData.valid_to,
        access_zones: [1] // Default access zone
      };
      
      const accessResponse = await accessService.createVisitorAccess(accessData);
      setAccessId(accessResponse.id);
      
      // Get QR image
      const qrResponse = await accessService.getQRCode(accessResponse.id);
      setQrImage(qrResponse.qr_code_image);
      
      setSuccess('Código QR generado exitosamente');
    } catch (err: any) {
      console.error('Error creating QR:', err);
      setError(err.message || 'Error al generar el código QR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">VeriAccessSCAE</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/user/dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/user/visitors" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Mis Visitantes
                </Link>
                <Link href="/user/create-qr" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Generar QR
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <button 
                onClick={() => {
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  localStorage.removeItem('user');
                  router.push('/auth/login');
                }}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Generar Código QR para Visitante</h1>
          
          {error && (
            <Alert variant="error" className="mb-6">
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" className="mb-6">
              <AlertTitle>{success}</AlertTitle>
            </Alert>
          )}
          
          <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg">
            {qrImage ? (
              <div className="px-4 py-5 sm:p-6 flex flex-col items-center">
                <div className="mb-4 text-lg font-semibold text-center">
                  Código QR generado
                </div>
                <div className="border p-4 bg-white rounded-lg shadow-md">
                  <img 
                    src={qrImage} 
                    alt="Código QR de acceso" 
                    className="w-64 h-64"
                  />
                </div>
                <div className="mt-6 flex space-x-3">
                  <Button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = qrImage;
                      link.download = `qr-visitor-${accessId}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Descargar QR
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setQrImage(null);
                      setAccessId(null);
                      setSuccess('');
                    }}
                  >
                    Generar otro
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                      Nombre
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="first_name"
                        id="first_name"
                        required
                        value={formData.first_name}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                      Apellido
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="last_name"
                        id="last_name"
                        required
                        value={formData.last_name}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="id_number" className="block text-sm font-medium text-gray-700">
                      Número de Identificación
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="id_number"
                        id="id_number"
                        required
                        value={formData.id_number}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Teléfono
                    </label>
                    <div className="mt-1">
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                      Empresa
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="company"
                        id="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="visitor_type" className="block text-sm font-medium text-gray-700">
                      Tipo de Visitante
                    </label>
                    <div className="mt-1">
                      <select
                        name="visitor_type"
                        id="visitor_type"
                        value={formData.visitor_type}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="regular">Regular</option>
                        <option value="business">Empresarial</option>
                        <option value="temporary">Temporal</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
                      Propósito de la visita
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="purpose"
                        id="purpose"
                        required
                        value={formData.purpose}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="valid_from" className="block text-sm font-medium text-gray-700">
                      Válido desde
                    </label>
                    <div className="mt-1">
                      <input
                        type="datetime-local"
                        name="valid_from"
                        id="valid_from"
                        required
                        value={formData.valid_from}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="valid_to" className="block text-sm font-medium text-gray-700">
                      Válido hasta
                    </label>
                    <div className="mt-1">
                      <input
                        type="datetime-local"
                        name="valid_to"
                        id="valid_to"
                        required
                        value={formData.valid_to}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    isLoading={loading}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Generar QR
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}