// src/app/user/visitors/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { accessService } from '../../../../../lib/api';
import { Button } from '../../../../../components/ui/Button';
import { Alert, AlertTitle } from '../../../../../components/ui/Alert';
import { Badge } from '../../../../../components/ui/Badge';

interface Visitor {
  id: number;
  first_name: string;
  last_name: string;
  id_number: string;
  phone?: string;
  email?: string;
  company?: string;
  status?: 'pending' | 'inside' | 'outside' | 'denied';
  created_at: string;
}

export default function VisitorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const visitorId = params.id as string;

  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchVisitorDetails();
  }, [router, visitorId]);

  const fetchVisitorDetails = async () => {
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
      console.error('Error fetching visitor details:', err);
      setError('No se pudo cargar la información del visitante');
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
              onClick={() => router.push('/user/visitors')}
              className="mr-4 text-blue-600 hover:text-blue-800"
            >
              &larr; Volver
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Detalles del Visitante</h1>
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
          ) : visitor ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xl font-medium">
                        {visitor.first_name.charAt(0)}{visitor.last_name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-xl font-medium text-gray-900">
                        {visitor.first_name} {visitor.last_name}
                      </h2>
                      <p className="text-sm text-gray-500">ID: {visitor.id_number}</p>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(visitor.status)}
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Nombre completo</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {visitor.first_name} {visitor.last_name}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Número de identificación</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {visitor.id_number}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {visitor.phone || 'No proporcionado'}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {visitor.email || 'No proporcionado'}
                    </dd>
                  </div>
                  {visitor.company && (
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Empresa</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {visitor.company}
                      </dd>
                    </div>
                  )}
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Estado</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {visitor.status === 'inside' ? 'Dentro del edificio' : 
                       visitor.status === 'outside' ? 'Fuera del edificio' :
                       visitor.status === 'denied' ? 'Acceso denegado' : 'Pendiente de acceso'}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Fecha de registro</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {new Date(visitor.created_at).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/user/visitors/${visitor.id}/qr`)}
                  >
                    Generar QR
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow p-6 rounded-lg text-center">
              <p className="text-gray-500">El visitante no fue encontrado.</p>
              <Button
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => router.push('/user/visitors')}
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