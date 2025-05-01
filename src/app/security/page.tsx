'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import LiveMonitoring from '../../../componentes/access/LiveMonitoring';
import { securityService } from '../../../lib/api';
import Link from 'next/link';

// Definición de tipos para los incidentes
interface Incident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed' | string;
  location: string;
  created_at: string;
}

interface ApiResponse {
  results?: Incident[];
}

// Función de guardia de tipo para verificar si es un Incident[]
function isIncidentArray(data: unknown): data is Incident[] {
  return Array.isArray(data) && data.every(item => 
    typeof item === 'object' && 
    item !== null &&
    'id' in item &&
    'title' in item &&
    'severity' in item &&
    'status' in item &&
    'location' in item &&
    'created_at' in item
  );
}

// Función de guardia de tipo para verificar si es un ApiResponse
function isApiResponse(data: unknown): data is ApiResponse {
  return typeof data === 'object' && 
    data !== null && 
    ('results' in data);
}

export default function SecurityPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        const response = await securityService.getIncidents();
        
        // Verificación de tipos en tiempo de ejecución
        if (isIncidentArray(response)) {
          setIncidents(response);
        } else if (isApiResponse(response) && response.results) {
          setIncidents(response.results);
        } else {
          console.warn('La respuesta de la API no coincide con los tipos esperados:', response);
          setIncidents([]);
          setError('Formato de datos inesperado');
        }
      } catch (err) {
        console.error('Error fetching incidents:', err);
        setError('No se pudieron cargar los incidentes de seguridad');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Seguridad</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Monitoreo en tiempo real */}
          <div>
            <LiveMonitoring />
          </div>
          
          {/* Incidentes recientes */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Incidentes recientes
              </h3>
              <Link 
                href="/security/incidents/new" 
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Reportar Incidente
              </Link>
            </div>
            
            {error && (
              <div className="px-4 py-2 sm:px-6">
                <div className="rounded-md bg-red-50 p-2">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <ul className="divide-y divide-gray-200">
              {loading ? (
                [...Array(3)].map((_, index) => (
                  <li key={index} className="px-4 py-4 sm:px-6 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="bg-gray-200 h-5 w-2/3 rounded"></div>
                      <div className="bg-gray-200 h-5 w-16 rounded-full"></div>
                    </div>
                    <div className="mt-2 bg-gray-200 h-4 w-1/2 rounded"></div>
                  </li>
                ))
              ) : incidents.length > 0 ? (
                incidents.map((incident) => (
                  <li key={incident.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link 
                          href={`/security/incidents/${incident.id}`}
                          className="text-sm font-medium text-primary-600 truncate hover:text-primary-800"
                        >
                          {incident.title}
                        </Link>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </span>
                        <span className={`ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                          {incident.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Ubicación: {incident.location}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>
                          {new Date(incident.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-4 py-6 sm:px-6 text-center text-gray-500">
                  No hay incidentes de seguridad registrados.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}