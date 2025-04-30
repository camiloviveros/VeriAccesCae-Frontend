'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { accessService } from '../../../lib/api';
import Link from 'next/link';

// Definición de tipos
interface AccessPoint {
  id: string | number;
  name: string;
  location: string;
  is_active: boolean;
  max_capacity: number;
  current_count: number;
  // Agrega otras propiedades que puedan existir
}

interface ApiResponse {
  results?: AccessPoint[];
  // Otras propiedades que pueda tener la respuesta
  [key: string]: any;
}

type RemoteControlAction = 'lock' | 'unlock';

export default function AccessPointsPage() {
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAccessPoints = async () => {
      try {
        setLoading(true);
        const response = await accessService.getAccessPoints() as ApiResponse | AccessPoint[];
        
        // Manejo seguro de la respuesta
        let data: AccessPoint[] = [];
        
        if (Array.isArray(response)) {
          // Si la respuesta es directamente un array
          data = response;
        } else if (response?.results && Array.isArray(response.results)) {
          // Si la respuesta tiene propiedad results
          data = response.results;
        } else if (response && typeof response === 'object') {
          // Si es un objeto pero no tiene results, convertirlo a array
          data = Object.values(response).filter(item => 
            typeof item === 'object' && item !== null
          ) as AccessPoint[];
        }
        
        setAccessPoints(data);
      } catch (err) {
        console.error('Error fetching access points:', err);
        setError('No se pudieron cargar los puntos de acceso');
      } finally {
        setLoading(false);
      }
    };

    fetchAccessPoints();
  }, []);

  const handleRemoteControl = async (id: string | number, action: RemoteControlAction) => {
    try {
      // Aserción de tipo temporal - deberías actualizar la definición de accessService
      await (accessService as any).remoteControl(id, action);
      
      // Actualizar la lista después de la acción
      const response = await accessService.getAccessPoints() as ApiResponse | AccessPoint[];
      
      // Mismo manejo de respuesta que en el useEffect
      let data: AccessPoint[] = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response?.results) {
        data = response.results;
      } else if (response && typeof response === 'object') {
        data = Object.values(response).filter(item => 
          typeof item === 'object' && item !== null
        ) as AccessPoint[];
      }
      
      setAccessPoints(data);
    } catch (err) {
      console.error(`Error ${action === 'lock' ? 'locking' : 'unlocking'} access point:`, err);
      setError(`No se pudo ${action === 'lock' ? 'bloquear' : 'desbloquear'} el punto de acceso`);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Puntos de Acceso</h1>
          <Link 
            href="/access/new" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Nuevo Punto de Acceso
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
          ) : accessPoints.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {accessPoints.map((accessPoint) => (
                <li key={accessPoint.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{accessPoint.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">{accessPoint.location}</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          accessPoint.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {accessPoint.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                        
                        <button
                          onClick={() => handleRemoteControl(accessPoint.id, accessPoint.is_active ? 'lock' : 'unlock')}
                          className={`px-3 py-1 text-xs font-medium rounded ${
                            accessPoint.is_active 
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >
                          {accessPoint.is_active ? 'Bloquear' : 'Desbloquear'}
                        </button>
                        
                        <Link
                          href={`/access/${accessPoint.id}`}
                          className="px-3 py-1 text-xs font-medium rounded bg-gray-50 text-gray-700 hover:bg-gray-100"
                        >
                          Detalles
                        </Link>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <span>Capacidad: {accessPoint.max_capacity > 0 ? accessPoint.max_capacity : 'Sin límite'}</span>
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Ocupación actual: {accessPoint.current_count} {accessPoint.max_capacity > 0 && `(${Math.round(accessPoint.current_count / accessPoint.max_capacity * 100)}%)`}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No hay puntos de acceso disponibles.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}