'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../../../../components/layout/DashboardLayout';
import { accessService } from '../../../../../../lib/api';
import { Button } from '../../../../../../components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '../../../../../../components/ui/Alert';
import { Badge } from '../../../../../../components/ui/Badge';
import { Loading } from '../../../../../../components/ui/Loading';

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
}

interface VisitorAccess {
  id: number;
  purpose: string;
  valid_from: string;
  valid_to: string;
  is_used: boolean;
  access_zones_detail?: { id: number; name: string }[];
  host_detail?: { username: string; full_name?: string };
  created_at: string;
}

export default function VisitorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const visitorId = params.id as string;

  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [visitorAccesses, setVisitorAccesses] = useState<VisitorAccess[]>([]);
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
          
          // Aquí podríamos obtener los accesos del visitante si hay un endpoint para ello
          // Por ahora, dejamos un array vacío
          setVisitorAccesses([]);
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
            <Button onClick={() => router.push(`/access/visitors/${visitorId}/access`)}>
              Crear Acceso
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
          <>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-16 w-16 rounded-full overflow-hidden bg-gray-100">
                    {visitor.photo ? (
                      // Usar img nativo en lugar de Image para evitar problemas con la configuración de Next.js
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
                    <h2 className="text-xl font-medium text-gray-900">
                      {visitor.first_name} {visitor.last_name}
                    </h2>
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
                </dl>
              </div>
            </div>

            <h2 className="text-lg font-medium text-gray-900 mt-8">Accesos del Visitante</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              {visitorAccesses.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {visitorAccesses.map((access) => (
                    <li key={access.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{access.purpose}</p>
                          <p className="text-sm text-gray-500">
                            Válido: {new Date(access.valid_from).toLocaleString()} - {new Date(access.valid_to).toLocaleString()}
                          </p>
                          {access.host_detail && (
                            <p className="text-sm text-gray-500">
                              Anfitrión: {access.host_detail.full_name || access.host_detail.username}
                            </p>
                          )}
                        </div>
                        <Badge variant={access.is_used ? 'secondary' : 'success'}>
                          {access.is_used ? 'Usado' : 'Activo'}
                        </Badge>
                      </div>
                      {access.access_zones_detail && access.access_zones_detail.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">Zonas de acceso:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {access.access_zones_detail.map(zone => (
                              <span 
                                key={zone.id} 
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {zone.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-6 text-center text-gray-500">
                  Este visitante no tiene accesos registrados. Utiliza el botón "Crear Acceso" para añadir uno.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center text-gray-500">
            Visitante no encontrado
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}