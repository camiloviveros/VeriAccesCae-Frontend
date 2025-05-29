'use client';

import { useState, useEffect, useRef } from 'react';
import { accessService } from '../../lib/api';
import React from 'react';

// Definir interfaces para los tipos
interface UserDetail {
  username?: string;
  full_name?: string;
}

interface AccessPointDetail {
  name?: string;
  location?: string;
}

interface AccessLog {
  id: number;
  user_detail?: UserDetail;
  access_point_detail?: AccessPointDetail;
  timestamp: string;
  status: 'granted' | 'denied';
  direction: 'in' | 'out';
}

// Definir interface para la respuesta del servicio
interface AccessLogsResponse {
  results?: AccessLog[];
  count?: number;
}

export default function LiveMonitoring() {
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Usar NodeJS.Timeout en lugar de null para el tipo de intervalo
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para cargar los logs de acceso recientes
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await accessService.getAccessLogs({ limit: 10 }) as AccessLogsResponse;
      if (response && response.results) {
        setAccessLogs(response.results);
      } else if (Array.isArray(response)) {
        setAccessLogs(response.slice(0, 10));
      } else {
        console.warn('Formato de respuesta inesperado:', response);
        setAccessLogs([]);
      }
      setError('');
    } catch (err) {
      console.error('Error fetching access logs:', err);
      setError('Error al cargar los registros de acceso');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cargar logs inicialmente
    fetchLogs();
    
    // Configurar actualización automática cada 10 segundos
    intervalRef.current = setInterval(fetchLogs, 10000);
    
    return () => {
      // Limpiar el intervalo cuando el componente se desmonte
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getStatusColor = (status: 'granted' | 'denied'): string => {
    return status === 'granted' 
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Monitoreo en Tiempo Real
          </h3>
          <button
            onClick={fetchLogs}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Actualizar
          </button>
        </div>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-2">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}
        
        <div className="flow-root">
          <ul className="-my-5 divide-y divide-gray-200">
            {loading ? (
              [...Array(3)].map((_, index) => (
                <li key={index} className="py-4 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-200 h-10 w-10 rounded-full"></div>
                    <div className="flex-1">
                      <div className="bg-gray-200 h-4 w-3/4 mb-2 rounded"></div>
                      <div className="bg-gray-200 h-3 w-1/2 rounded"></div>
                    </div>
                    <div className="bg-gray-200 h-5 w-16 rounded-full"></div>
                  </div>
                </li>
              ))
            ) : accessLogs.length > 0 ? (
              accessLogs.map((log) => (
                <li key={log.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-100">
                        <span className="text-sm font-medium leading-none text-gray-800">
                          {log.user_detail?.username?.charAt(0) || 'V'}
                        </span>
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {log.user_detail?.full_name || log.user_detail?.username || 'Visitante'} en {log.access_point_detail?.name || 'Punto de acceso'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {new Date(log.timestamp).toLocaleString()} - {log.direction === 'in' ? 'Entrada' : 'Salida'}
                      </p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                        {log.status === 'granted' ? 'Permitido' : 'Denegado'}
                      </span>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="py-4 text-center text-gray-500">
                No hay registros de acceso recientes.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}