'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { accessService } from '../../../../lib/api';
import { Button } from '../../../../components/ui/Button';
import { Alert, AlertTitle } from '../../../../components/ui/Alert';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';

export default function CreateVisitPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'normal' | 'temporary' | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    id_number: '',
    phone: '',
    apartment_number: '',
    entry_date: '',
    exit_date: '',
    description: '', // NUEVO CAMPO
  });
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

    // Initialize dates for temporary visits
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    setFormData(prev => ({
      ...prev,
      entry_date: now.toISOString().slice(0, 16),
      exit_date: tomorrow.toISOString().slice(0, 16)
    }));
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      // Create visitor data object
      const visitorData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        id_number: formData.id_number,
        phone: formData.phone,
        visitor_type: selectedType,
        status: 'pending',
        description: formData.description, // INCLUIR DESCRIPCIÓN
      };
      
      // Add type-specific fields
      if (selectedType === 'normal') {
        visitorData.apartment_number = formData.apartment_number;
      } else if (selectedType === 'temporary') {
        visitorData.entry_date = formData.entry_date;
        visitorData.exit_date = formData.exit_date;
      }
      
      // Create the visitor
      const visitorResponse = await accessService.createVisitor(visitorData);
      
      setSuccess('¡Visita registrada exitosamente! Su solicitud está siendo revisada por el administrador. Recibirá un código QR una vez aprobada.');
      
      // Redirect after success
      setTimeout(() => {
        router.push('/user/visits');
      }, 3000);
      
    } catch (err: any) {
      console.error('Error creating visit:', err);
      let errorMsg = "Error al registrar la visita";
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (err.response.data.detail) {
          errorMsg = err.response.data.detail;
        } else if (typeof err.response.data === 'object') {
          // Format validation errors
          errorMsg = Object.entries(err.response.data)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-blue-600 shadow-sm text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">VeriAccessSCAE</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/user/dashboard" className="border-transparent text-blue-100 hover:border-white hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/user/visits" className="border-transparent text-blue-100 hover:border-white hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Mis Visitas
                </Link>
                <Link href="/user/create-visit" className="border-white text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Registrar Visita
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
                className="text-blue-100 hover:text-white text-sm font-medium"
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
              onClick={() => router.push('/user/dashboard')}
              className="mr-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Volver al Dashboard
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Registrar Nueva Visita</h1>
          </div>
          
          {error && (
            <Alert variant="error" className="mb-6 border-red-500 bg-red-50">
              <AlertTitle className="text-red-800">Error</AlertTitle>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" className="mb-6 border-green-500 bg-green-50">
              <AlertTitle className="text-green-800">¡Éxito!</AlertTitle>
              <p className="text-green-700 text-sm mt-1">{success}</p>
            </Alert>
          )}

          {!selectedType ? (
            // Step 1: Select visit type
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card 
                className="cursor-pointer transition-all duration-200 hover:shadow-lg border-2 border-gray-200 hover:border-blue-300"
                onClick={() => setSelectedType('normal')}
              >
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <CardTitle className="text-gray-900 flex items-center">
                    <span className="text-2xl mr-3">🏠</span>
                    Visita Normal
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-600 mb-4">
                    Para visitas regulares a un apartamento específico. No requiere fechas de entrada y salida.
                  </p>
                  <ul className="text-sm text-gray-500 space-y-2">
                    <li>• Ideal para familiares y amigos</li>
                    <li>• Se especifica el número de apartamento</li>
                    <li>• Sin límite de tiempo</li>
                    <li>• Aprobación del administrador</li>
                  </ul>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer transition-all duration-200 hover:shadow-lg border-2 border-gray-200 hover:border-yellow-300"
                onClick={() => setSelectedType('temporary')}
              >
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <CardTitle className="text-gray-900 flex items-center">
                    <span className="text-2xl mr-3">⏰</span>
                    Visita Temporal
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-600 mb-4">
                    Para visitas con fecha y hora específicas de entrada y salida.
                  </p>
                  <ul className="text-sm text-gray-500 space-y-2">
                    <li>• Ideal para servicios o citas</li>
                    <li>• Fecha/hora de entrada y salida</li>
                    <li>• Acceso limitado en tiempo</li>
                    <li>• Aprobación del administrador</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Step 2: Fill form based on selected type
            <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg border border-gray-200">
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {selectedType === 'normal' ? '🏠' : '⏰'}
                    </span>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {selectedType === 'normal' ? 'Visita Normal' : 'Visita Temporal'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedType === 'normal' 
                          ? 'Complete los datos para crear una visita regular'
                          : 'Complete los datos incluyendo fechas de entrada y salida'
                        }
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedType(null);
                      setError('');
                      setSuccess('');
                    }}
                    className="text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Cambiar Tipo
                  </Button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                      Nombre *
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
                        placeholder="Ingrese el nombre"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                      Apellido *
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
                        placeholder="Ingrese el apellido"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="id_number" className="block text-sm font-medium text-gray-700">
                      Número de Identificación *
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
                        placeholder="Ej: 12345678"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Teléfono *
                    </label>
                    <div className="mt-1">
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Ej: +57 300 123 4567"
                      />
                    </div>
                  </div>

                  {selectedType === 'normal' && (
                    <div className="sm:col-span-3">
                      <label htmlFor="apartment_number" className="block text-sm font-medium text-gray-700">
                        Número de Apartamento *
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="apartment_number"
                          id="apartment_number"
                          required
                          value={formData.apartment_number}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Ej: 101, 205A, etc."
                        />
                      </div>
                    </div>
                  )}

                  {selectedType === 'temporary' && (
                    <>
                      <div className="sm:col-span-3">
                        <label htmlFor="entry_date" className="block text-sm font-medium text-gray-700">
                          Fecha y Hora de Entrada *
                        </label>
                        <div className="mt-1">
                          <input
                            type="datetime-local"
                            name="entry_date"
                            id="entry_date"
                            required
                            value={formData.entry_date}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="exit_date" className="block text-sm font-medium text-gray-700">
                          Fecha y Hora de Salida *
                        </label>
                        <div className="mt-1">
                          <input
                            type="datetime-local"
                            name="exit_date"
                            id="exit_date"
                            required
                            min={formData.entry_date}
                            value={formData.exit_date}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* NUEVO CAMPO DE DESCRIPCIÓN */}
                  <div className="sm:col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Descripción o Motivo de la Visita (Opcional)
                    </label>
                    <div className="mt-1">
                      <textarea
                        name="description"
                        id="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Proporcione detalles adicionales sobre el motivo de la visita (opcional)"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Esta información ayudará al administrador a evaluar su solicitud.
                    </p>
                  </div>
                </div>

                {/* Information box */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Información importante</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Su solicitud será enviada al administrador para revisión. Una vez aprobada, 
                        recibirá un código QR que podrá usar para el acceso. Podrá verificar el estado 
                        de su solicitud en la sección "Mis Visitas".
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/user/dashboard')}
                    className="text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    isLoading={loading}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? 'Enviando Solicitud...' : 'Enviar Solicitud'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}