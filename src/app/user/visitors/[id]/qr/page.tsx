'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { accessService } from '../../../../../../lib/api';
import { Button } from '../../../../../../components/ui/Button';
import { Alert, AlertTitle } from '../../../../../../components/ui/Alert';

interface Visitor {
  id: number;
  first_name: string;
  last_name: string;
}

export default function VisitorQRPage() {
  const params = useParams();
  const router = useRouter();
  const visitorId = params.id as string;

  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [accessId, setAccessId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    purpose: 'Visita',
    valid_from: '',
    valid_to: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

    fetchVisitor();
  }, [router, visitorId]);

  const fetchVisitor = async () => {
    try {
      setLoading(true);
      
      // Fetch all visitors
      const visitorsResponse = await accessService.getVisitors();
      
      // Parse response
      let visitors: Visitor[] = [];
      if (Array.isArray(visitorsResponse)) {
        visitors = visitorsResponse;
      } else if (visitorsResponse?.results && Array.isArray(visitorsResponse.results)) {
        visitors = visitorsResponse.results;
      } else if (visitorsResponse && typeof visitorsResponse === 'object') {
        visitors = Object.values(visitorsResponse).filter(val => 
          typeof val === 'object' && val !== null && 'id' in val
        ) as Visitor[];
      }
      
      // Find specific visitor
      const found = visitors.find(v => v.id.toString() === visitorId);
      
      if (found) {
        setVisitor(found);
      } else {
        setError('Visitante no encontrado');
      }
    } catch (err) {
      console.error('Error fetching visitor:', err);
      setError('No se pudo cargar la información del visitante');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!visitor) {
      setError('Visitante no encontrado');
      return;
    }

    // Validación de fechas
    const validFrom = new Date(formData.valid_from);
    const validTo = new Date(formData.valid_to);
    
    if (validFrom >= validTo) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }
    
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      // Create access with QR
      const accessData = {
        visitor: visitor.id,
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
      setSubmitting(false);
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
                <Link href="/user/visitors" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Mis Visitantes
                </Link>
                <Link href="/user/create-qr" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
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
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.push(`/user/visitors/${visitorId}`)}
              className="mr-4 text-blue-600 hover:text-blue-800"
            >
              &larr; Volver
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">
              Generar QR para {visitor?.first_name} {visitor?.last_name}
            </h1>
          </div>
          
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
          
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : visitor ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              {qrImage ? (
                <div className="px-4 py-5 sm:p-6 flex flex-col items-center">
                  <div className="mb-4 text-lg font-semibold text-center">
                    Código QR generado para {visitor.first_name} {visitor.last_name}
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
                    <div className="sm:col-span-6">
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
                      isLoading={submitting}
                      disabled={submitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Generar QR
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-white shadow p-6 rounded-lg">
              <div className="text-center text-gray-600">
                No se encontró información del visitante. Por favor, vuelva atrás e intente de nuevo.
              </div>
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={() => router.push('/user/visitors')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Volver a la lista de visitantes
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}