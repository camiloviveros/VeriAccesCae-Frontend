'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { accessService } from '../../../lib/api';
import Link from 'next/link';
import { Alert, AlertTitle } from '../../../components/ui/Alert';
import { Loading } from '../../../components/ui/Loading';
import { Button } from '../../../components/ui/Button';

interface Visitor {
  id: number;
  id_number: string;
  first_name: string;
  last_name: string;
  photo?: string;
  company?: string;
  email?: string;
  phone?: string;
  visitor_type?: string;
  apartment_number?: string;
  entry_date?: string;
  exit_date?: string;
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
        </div>

        {/* Sección de botones para los tipos de visitantes */}
        <div className="bg-white p-6 shadow rounded-lg">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Registrar nuevo visitante</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/access/visitors/new/business">
              <Button className="w-full py-6" variant="default">
                <div className="flex flex-col items-center">
                  <svg className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Visitante Empresa</span>
                </div>
              </Button>
            </Link>
            
            <Link href="/access/visitors/new/regular">
              <Button className="w-full py-6" variant="outline">
                <div className="flex flex-col items-center">
                  <svg className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Visitante Normal</span>
                </div>
              </Button>
            </Link>
            
            <Link href="/access/visitors/new/temporary">
              <Button className="w-full py-6" variant="secondary">
                <div className="flex flex-col items-center">
                  <svg className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Visitante Temporal</span>
                </div>
              </Button>
            </Link>
          </div>
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
                          <img 
                            src={visitor.photo}
                            alt={`${visitor.first_name} ${visitor.last_name}`}
                            className="h-12 w-12 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
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
                          <div className="ml-2 flex-shrink-0 flex space-x-2">
                            <span className="px-2 py-1 inline-flex text-xs font-medium rounded-md bg-blue-100 text-blue-800">
                              {visitor.visitor_type || (visitor.company ? 'Empresa' : 'Normal')}
                            </span>
                            <Link
                              href={`/access/visitors/${visitor.id}`}
                              className="px-3 py-1 text-xs font-medium rounded bg-gray-50 text-gray-700 hover:bg-gray-100"
                            >
                              Ver Detalles
                            </Link>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between">
                          <div>
                            {visitor.id_number && (
                              <p className="text-sm text-gray-500">
                                ID: {visitor.id_number}
                              </p>
                            )}
                            {visitor.apartment_number && (
                              <p className="text-sm text-gray-500">
                                Apartamento: {visitor.apartment_number}
                              </p>
                            )}
                            {visitor.company && (
                              <p className="text-sm text-gray-500">
                                Empresa: {visitor.company}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {visitor.phone && (
                              <p>{visitor.phone}</p>
                            )}
                            {visitor.email && (
                              <p>{visitor.email}</p>
                            )}
                            {visitor.entry_date && visitor.exit_date && (
                              <p>Visita: {new Date(visitor.entry_date).toLocaleString()} - {new Date(visitor.exit_date).toLocaleString()}</p>
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
              No hay visitantes registrados. Utiliza los botones para registrar uno nuevo.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}