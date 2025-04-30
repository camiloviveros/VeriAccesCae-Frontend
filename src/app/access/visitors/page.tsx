'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { accessService } from '../../../../lib/api';
import Link from 'next/link';
import Image from 'next/image';

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

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        setLoading(true);
        const response = await accessService.getVisitors();
        
        // Función de tipo guard para verificar si es un Visitor
        const isVisitor = (obj: any): obj is Visitor => {
          return (
            typeof obj === 'object' &&
            obj !== null &&
            'id' in obj &&
            'id_number' in obj &&
            'first_name' in obj &&
            'last_name' in obj
          );
        };

        // Función para transformar la respuesta a Visitor[]
        const parseVisitors = (data: unknown): Visitor[] => {
          if (Array.isArray(data)) {
            return data.filter(isVisitor);
          }
          if (typeof data === 'object' && data !== null && 'results' in data) {
            const results = (data as { results: unknown }).results;
            if (Array.isArray(results)) {
              return results.filter(isVisitor);
            }
          }
          return [];
        };

        setVisitors(parseVisitors(response));
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
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="p-6 animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : visitors.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {visitors.map((visitor) => (
                <li key={visitor.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                        {visitor.photo ? (
                          <Image 
                            src={visitor.photo}
                            alt={`${visitor.first_name} ${visitor.last_name}`}
                            width={48}
                            height={48}
                            className="h-12 w-12 object-cover"
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
              No hay visitantes registrados.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}