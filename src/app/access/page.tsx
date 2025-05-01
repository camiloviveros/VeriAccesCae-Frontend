'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { accessService } from '../../../lib/api';
import Link from 'next/link';
import { Alert, AlertTitle } from '../../../components/ui/Alert';
import { Loading } from '../../../components/ui/Loading';

interface Visitor {
  id: number;
  id_number: string;
  first_name: string;
  last_name: string;
  photo?: string;
  company?: string;
  email?: string;
  phone?: string;
}

interface ApiResponse {
  results?: Visitor[];
  count?: number;
}

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        setLoading(true);
        const response = await accessService.getVisitors();
        
        // Determinar el tipo de respuesta y extraer los visitantes
        let visitorsList: Visitor[] = [];
        if (Array.isArray(response)) {
          visitorsList = response;
        } else if (response && response.results && Array.isArray(response.results)) {
          visitorsList = response.results;
        } else if (response && typeof response === 'object') {
          // Intentar extraer visitantes si la respuesta es un objeto pero no con el formato esperado
          const possibleVisitors = Object.values(response).filter(val => 
            typeof val === 'object' && val !== null && 'id' in val && 'first_name' in val && 'last_name' in val
          );
          visitorsList = possibleVisitors as Visitor[];
        }
        
        setVisitors(visitorsList);
      } catch (err) {
        console.error('Error fetching visitors:', err);
        setError('No se pudieron cargar los visitantes');
      } finally {
        setLoading(false);
      }
    };

    fetchVisitors();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Visitantes</h1>
          <Link 
            href="/access/visitors/new" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Registrar Nuevo Visitante
          </Link>
        </div>

        {error && (
          <Alert variant="error">
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loading size="lg" message="Cargando visitantes..." />
            </div>
          ) : visitors.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {visitors.map((visitor) => (
                <li key={visitor.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                        {visitor.photo ? (
                          // Usar img nativo en lugar de Image para evitar problemas con la configuración de Next.js
                          <img 
                            src={visitor.photo}
                            alt={`${visitor.first_name} ${visitor.last_name}`}
                            className="h-12 w-12 object-cover"
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
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {visitor.first_name} {visitor.last_name}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <Link
                              href={`/access/visitors/${visitor.id}`}
                              className="px-3 py-1 text-xs font-medium rounded bg-gray-50 text-gray-700 hover:bg-gray-100"
                            >
                              Ver Detalles
                            </Link>
                            <Link
                              href={`/access/visitors/${visitor.id}/access`}
                              className="ml-2 px-3 py-1 text-xs font-medium rounded bg-primary-50 text-primary-700 hover:bg-primary-100"
                            >
                              Crear Acceso
                            </Link>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between">
                          <div>
                            <p className="text-sm text-gray-500">
                              ID: {visitor.id_number}
                            </p>
                            {visitor.company && (
                              <p className="text-sm text-gray-500">
                                Empresa: {visitor.company}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {visitor.email && (
                              <p>{visitor.email}</p>
                            )}
                            {visitor.phone && (
                              <p>{visitor.phone}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No hay visitantes registrados. Utiliza el botón "Registrar Nuevo Visitante" para añadir uno.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}