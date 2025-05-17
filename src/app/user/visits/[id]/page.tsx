// src/app/user/visits/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { accessService } from '../../../../../lib/api';
import { Button } from '../../../../../components/ui/Button';
import { Alert, AlertTitle } from '../../../../../components/ui/Alert';
import { Badge } from '../../../../../components/ui/Badge';

interface Visit {
  id: number;
  first_name: string;
  last_name: string;
  id_number: string;
  phone?: string;
  email?: string;
  company?: string;
  status?: 'pending' | 'inside' | 'outside' | 'denied';
  created_at: string;
  visitor_type?: string;
  apartment_number?: string;
  entry_date?: string;
  exit_date?: string;
}

export default function VisitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const visitId = params.id as string;

  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchVisitDetails();
  }, [router, visitId]);

  const fetchVisitDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch all visitors
      const visitorsResponse = await accessService.getVisitors();
      
      // Parse response
      let visitors: Visit[] = [];
      if (Array.isArray(visitorsResponse)) {
        visitors = visitorsResponse;
      } else if (visitorsResponse?.results && Array.isArray(visitorsResponse.results)) {
        visitors = visitorsResponse.results;
      } else if (visitorsResponse && typeof visitorsResponse === 'object') {
        visitors = Object.values(visitorsResponse).filter(val => 
          typeof val === 'object' && val !== null && 'id' in val
        ) as Visit[];
      }
      
      // Find specific visitor
      const found = visitors.find(v => v.id.toString() === visitId);
      
      if (found) {
        setVisit(found);
      } else {
        setError('Visita no encontrada');
      }
    } catch (err) {
      console.error('Error fetching visit details:', err);
      setError('No se pudo cargar la información de la visita');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch(status) {
      case 'inside':
        return <Badge variant="success">Dentro</Badge>;
      case 'outside':
        return <Badge variant="secondary">Fuera</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denegado</Badge>;
      default:
        return <Badge variant="info">Pendiente</Badge>;
    }
  };

  const getStatusText = (status?: string) => {
    switch(status) {
      case 'inside':
        return 'Dentro del edificio';
      case 'outside':
        return 'Fuera del edificio';
      case 'denied':
        return 'Acceso denegado';
      default:
        return 'Pendiente de aprobación';
    }
  };

  const getVisitTypeName = (type?: string) => {
    switch(type) {
      case 'regular':
        return 'Regular';
      case 'business':
        return 'Empresarial';
      case 'temporary':
        return 'Temporal';
      default:
        return 'Regular';
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
                <Link href="/user/dashboard" className="border-transparent text-white hover:border-white hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/user/visits" className="border-white text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Mis Visitas
                </Link>
                <Link href="/user/create-qr" className="border-transparent text-white hover:border-white hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
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
                className="text-white hover:text-gray-200 text-sm font-medium"
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
              onClick={() => router.push('/user/visits')}
              className="mr-4 text-blue-600 hover:text-blue-800"
            >
              &larr; Volver
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Detalles de la Visita</h1>
          </div>
          
          {error && (
            <Alert variant="error" className="mb-6">
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : visit ? (
            <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg border border-gray-200">
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xl font-medium">
                        {visit.first_name.charAt(0)}{visit.last_name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-xl font-medium text-gray-900">
                        {visit.first_name} {visit.last_name}
                      </h2>
                      <p className="text-sm text-gray-500">ID: {visit.id_number}</p>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(visit.status)}
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Tipo de visita</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {getVisitTypeName(visit.visitor_type)}
                    </dd>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Nombre completo</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {visit.first_name} {visit.last_name}
                    </dd>
                  </div>
                  
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Número de identificación</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {visit.id_number}
                    </dd>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {visit.phone || 'No proporcionado'}
                    </dd>
                  </div>
                  
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {visit.email || 'No proporcionado'}
                    </dd>
                  </div>
                  
                  {visit.company && (
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Empresa</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {visit.company}
                      </dd>
                    </div>
                  )}
                  
                  {visit.apartment_number && (
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Apartamento</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {visit.apartment_number}
                      </dd>
                    </div>
                  )}
                  
                  {visit.entry_date && visit.exit_date && (
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Periodo de visita</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {new Date(visit.entry_date).toLocaleString()} - {new Date(visit.exit_date).toLocaleString()}
                      </dd>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Estado</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {getStatusText(visit.status)}
                    </dd>
                  </div>
                  
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Fecha de registro</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {new Date(visit.created_at).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/user/visits/${visit.id}/qr`)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    Ver Código QR
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-lg p-6 rounded-lg text-center border border-gray-200">
              <p className="text-gray-500">La visita no fue encontrada.</p>
              <Button
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => router.push('/user/visits')}
              >
                Volver a la lista
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}