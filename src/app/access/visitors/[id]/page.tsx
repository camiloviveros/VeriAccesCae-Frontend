'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../../../components/layout/DashboardLayout';
import { accessService } from '../../../../../lib/api';
import { Button } from '../../../../../components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '../../../../../components/ui/Alert';
import { Badge } from '../../../../../components/ui/Badge';
import { Loading } from '../../../../../components/ui/Loading';
import Link from 'next/link';

interface Visitor {
  id: number;
  first_name: string;
  last_name: string;
  id_number: string;
  phone?: string;
  email?: string;
  company?: string;
  photo?: string;
  created_at: string;
  status?: 'pending' | 'approved' | 'inside' | 'outside' | 'denied';
}

export default function VisitorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const visitorId = params.id as string;

  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVisitorDetails = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Obtener todos los visitantes
        const visitorsResponse = await accessService.getVisitors();
        
        // Determinar si la respuesta es un array o una respuesta paginada
        let visitors: Visitor[] = [];
        if (Array.isArray(visitorsResponse)) {
          visitors = visitorsResponse;
        } else if (visitorsResponse && visitorsResponse.results && Array.isArray(visitorsResponse.results)) {
          visitors = visitorsResponse.results;
        } else if (visitorsResponse && typeof visitorsResponse === 'object') {
          // Intentar extraer visitantes si la respuesta es un objeto pero no con el formato esperado
          const possibleVisitors = Object.values(visitorsResponse).filter(val => 
            typeof val === 'object' && val !== null && 'id' in val && 'first_name' in val && 'last_name' in val
          );
          visitors = possibleVisitors as Visitor[];
        }
        
        // Encontrar el visitante específico
        const foundVisitor = visitors.find(v => v.id.toString() === visitorId);
        
        if (foundVisitor) {
          setVisitor(foundVisitor);
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

    fetchVisitorDetails();
  }, [visitorId]);

  // Función para obtener el color del badge según el status
  const getStatusBadge = (status?: string) => {
    switch(status) {
      case 'inside':
        return <Badge variant="success">Dentro</Badge>;
      case 'outside':
        return <Badge variant="secondary">Fuera</Badge>;
      case 'approved':
        return <Badge variant="info">Aprobado</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denegado</Badge>;
      default:
        return <Badge variant="warning">Pendiente</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loading size="lg" message="Cargando información del visitante..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Detalles del Visitante</h1>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => router.push('/access/visitors')}>
              Volver
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="error">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {visitor ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-start border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-16 w-16 rounded-full overflow-hidden bg-gray-100">
                  {visitor.photo ? (
                    <img 
                      src={visitor.photo}
                      alt={`${visitor.first_name} ${visitor.last_name}`}
                      className="h-16 w-16 object-cover"
                      onError={(e) => {
                        // Ocultar la imagen si falla la carga
                        (e.target as HTMLImageElement).style.display = 'none';
                        // Mostrar el icono por defecto
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.innerHTML = `<svg class="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>`;
                        }
                      }}
                    />
                  ) : (
                    <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                </div>
                <div className="ml-4">
                  <div className="flex items-center">
                    <h2 className="text-xl font-medium text-gray-900">
                      {visitor.first_name} {visitor.last_name}
                    </h2>
                    <span className="ml-2">{getStatusBadge(visitor.status)}</span>
                  </div>
                  <p className="text-sm text-gray-500">ID: {visitor.id_number}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200">
              <dl>
                {visitor.company && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Empresa</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {visitor.company}
                    </dd>
                  </div>
                )}
                {visitor.email && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {visitor.email}
                    </dd>
                  </div>
                )}
                {visitor.phone && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {visitor.phone}
                    </dd>
                  </div>
                )}
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Fecha de registro</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(visitor.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Estado</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {visitor.status === 'inside' ? 'Dentro del edificio' : 
                     visitor.status === 'outside' ? 'Fuera del edificio' :
                     visitor.status === 'approved' ? 'Aprobado - QR disponible' :
                     visitor.status === 'denied' ? 'Acceso denegado' : 'Pendiente de aprobación'}
                  </dd>
                </div>
              </dl>
            </div>
            
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Acciones</h3>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {visitor.status === 'pending' && (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={async () => {
                      try {
                        await accessService.updateVisitorStatus(visitor.id, 'approved');
                        setVisitor({...visitor, status: 'approved'});
                      } catch (err) {
                        console.error('Error updating status:', err);
                        setError('Error al actualizar el estado del visitante');
                      }
                    }}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Aprobar solicitud
                  </Button>
                )}
                {visitor.status === 'inside' && (
                  <Button 
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={async () => {
                      try {
                        await accessService.updateVisitorStatus(visitor.id, 'outside');
                        setVisitor({...visitor, status: 'outside'});
                      } catch (err) {
                        console.error('Error updating status:', err);
                        setError('Error al actualizar el estado del visitante');
                      }
                    }}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Registrar salida
                  </Button>
                )}
                <Button 
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={async () => {
                    if (visitor.status === 'inside') {
                      setError('No se puede eliminar un visitante que está dentro del edificio');
                      return;
                    }
                    if (confirm('¿Está seguro que desea eliminar este visitante?')) {
                      try {
                        await accessService.deleteVisitor(visitor.id);
                        router.push('/access/visitors');
                      } catch (err) {
                        console.error('Error deleting visitor:', err);
                        setError('Error al eliminar el visitante');
                      }
                    }
                  }}
                  disabled={visitor.status === 'inside'}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar visitante
                </Button>
              </div>
              {visitor.status === 'approved' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> El visitante ha sido aprobado. El código QR debe ser generado desde la interfaz del usuario.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : !error ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center text-gray-500">
            Cargando información del visitante...
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}