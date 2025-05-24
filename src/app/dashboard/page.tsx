// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { accessService } from '../../../lib/api';
import StatCard from '../../../components/dashboard/StatCard';
import { Loading } from '../../../components/ui/Loading';
import { Alert } from '../../../components/ui/Alert';

// Heroicons
import { 
  UserCircleIcon, 
  BuildingOffice2Icon, 
  ClockIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline';

// Definición de tipos
interface Visitor {
  id: number;
  visitor_type?: string;
  company?: string;
  entry_date?: string;
  exit_date?: string;
  status?: 'pending' | 'inside' | 'outside' | 'denied' | 'approved';
}

interface AccessLog {
  id: number;
  user_detail?: {
    username: string;
  };
  status: 'granted' | 'denied';
  access_point_detail?: {
    name: string;
  };
  timestamp: string;
  direction: 'in' | 'out';
}

interface OccupancyData {
  residents: number;
  visitors: number;
  total: number;
  maxCapacity: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalVisitorsInside: 0,
    businessVisitorsInside: 0,
    regularVisitorsInside: 0,
    temporaryVisitorsInside: 0,
    visitorsInside: 0,
    recentAccessLogs: [] as AccessLog[]
  });
  const [occupancyData, setOccupancyData] = useState<OccupancyData>({
    residents: 0,
    visitors: 0,
    total: 0,
    maxCapacity: 100
  });

  // Función para cargar y persistir datos de aforo
  const loadOccupancyData = () => {
    try {
      const stored = localStorage.getItem('buildingOccupancy');
      if (stored) {
        const parsed = JSON.parse(stored);
        setOccupancyData(prev => ({
          ...prev,
          residents: parsed.residents || 0,
          maxCapacity: parsed.maxCapacity || 100
        }));
      }
    } catch (error) {
      console.error('Error loading occupancy data:', error);
    }
  };

  // Función para guardar datos de aforo
  const saveOccupancyData = (data: Partial<OccupancyData>) => {
    try {
      const updated = { ...occupancyData, ...data };
      localStorage.setItem('buildingOccupancy', JSON.stringify(updated));
      setOccupancyData(updated);
    } catch (error) {
      console.error('Error saving occupancy data:', error);
    }
  };

  // Función para actualizar datos del dashboard
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Obtener visitantes
      const visitorsResponse = await accessService.getVisitors();
      
      // Procesar visitantes
      let visitors: Visitor[] = [];
      if (Array.isArray(visitorsResponse)) {
        visitors = visitorsResponse.map(v => ({
          ...v,
          status: (v.status === 'pending' || v.status === 'inside' || 
                  v.status === 'outside' || v.status === 'denied' || v.status === 'approved') 
                  ? v.status : 'pending'
        }));
      } else if (visitorsResponse && visitorsResponse.results && Array.isArray(visitorsResponse.results)) {
        visitors = visitorsResponse.results.map(v => ({
          ...v,
          status: (v.status === 'pending' || v.status === 'inside' || 
                  v.status === 'outside' || v.status === 'denied' || v.status === 'approved') 
                  ? v.status : 'pending'
        }));
      } else if (visitorsResponse && typeof visitorsResponse === 'object') {
        const possibleVisitors = Object.values(visitorsResponse).filter(val => 
          typeof val === 'object' && val !== null && 'id' in val
        );
        visitors = possibleVisitors as Visitor[];
      }
      
      // CONTAR SOLO VISITANTES QUE ESTÁN DENTRO (status = 'inside')
      const visitorsInside = visitors.filter(v => v.status === 'inside');
      
      // Filtrar los visitantes dentro por tipo
      const businessVisitorsInside = visitorsInside.filter(v => 
        v.visitor_type === 'business' || Boolean(v.company)
      ).length;
      
      const temporaryVisitorsInside = visitorsInside.filter(v => 
        v.visitor_type === 'temporary' || (Boolean(v.entry_date) && Boolean(v.exit_date))
      ).length;
      
      const regularVisitorsInside = visitorsInside.filter(v => 
        v.visitor_type === 'regular' || 
        (!v.visitor_type && !v.company && !v.entry_date && !v.exit_date)
      ).length;
      
      // Obtener registros de acceso recientes en tiempo real
      const logsResponse = await accessService.getAccessLogs({ limit: 10 });
      let accessLogs: AccessLog[] = [];
      if (Array.isArray(logsResponse)) {
        accessLogs = logsResponse;
      } else if (logsResponse && logsResponse.results && Array.isArray(logsResponse.results)) {
        accessLogs = logsResponse.results;
      }
      
      // Filtrar y ordenar los logs más recientes
      accessLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      accessLogs = accessLogs.slice(0, 5);
      
      // Cargar datos de aforo persistidos
      loadOccupancyData();
      
      // Actualizar el conteo de visitantes en el aforo
      const updatedOccupancy = {
        ...occupancyData,
        visitors: visitorsInside.length,
        total: occupancyData.residents + visitorsInside.length
      };
      saveOccupancyData(updatedOccupancy);
      
      setStats({
        totalVisitorsInside: visitorsInside.length,
        businessVisitorsInside,
        regularVisitorsInside,
        temporaryVisitorsInside,
        visitorsInside: visitorsInside.length,
        recentAccessLogs: accessLogs
      });
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  // useEffect para cargar datos iniciales y configurar eventos para actualización en tiempo real
  useEffect(() => {
    // Cargar datos iniciales
    fetchDashboardData();
    
    // Manejar cambios en el localStorage y eventos personalizados
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'buildingOccupancy') {
        loadOccupancyData();
      }
    };
    
    const handleVisitorChange = () => {
      console.log('Cambio detectado en visitantes, actualizando dashboard...');
      fetchDashboardData();
    };
    
    // Escuchar cambios en localStorage y eventos personalizados
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('visitorStatusChanged', handleVisitorChange);
    window.addEventListener('visitorDeleted', handleVisitorChange);
    window.addEventListener('visitorCreated', handleVisitorChange);
    
    // Configurar actualización automática cada 10 segundos para datos en tiempo real
    const intervalId = setInterval(() => {
      console.log('Actualización automática del dashboard...');
      fetchDashboardData();
    }, 10000);
    
    // Limpiar listeners y timers
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('visitorStatusChanged', handleVisitorChange);
      window.removeEventListener('visitorDeleted', handleVisitorChange);
      window.removeEventListener('visitorCreated', handleVisitorChange);
      clearInterval(intervalId);
    };
  }, []);

  // Función para actualizar manualmente
  const handleManualRefresh = () => {
    fetchDashboardData();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 bg-gray-50">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Panel de Control</h1>
          <button
            onClick={handleManualRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            disabled={loading}
          >
            {loading ? '🔄 Actualizando...' : '🔄 Actualizar'}
          </button>
        </div>
        
        {error && <Alert variant="error">{error}</Alert>}
        
        {loading ? (
          <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-md">
            <Loading size="lg" message="Cargando datos del dashboard..." />
          </div>
        ) : (
          <>
            {/* Estadísticas principales - SOLO VISITANTES DENTRO */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total de visitantes DENTRO */}
              <div className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
                      <UserGroupIcon className="h-6 w-6 text-gray-700" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-600 truncate">
                          Visitantes Dentro
                        </dt>
                        <dd>
                          <div className="text-lg font-bold text-gray-900">
                            {stats.totalVisitorsInside}
                          </div>
                          <div className="text-xs text-gray-500">
                            Actualmente en el edificio
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Visitantes empresariales DENTRO */}
              <div className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                      <BuildingOffice2Icon className="h-6 w-6 text-green-700" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-600 truncate">
                          Empresa (Dentro)
                        </dt>
                        <dd>
                          <div className="text-lg font-bold text-gray-900">
                            {stats.businessVisitorsInside}
                          </div>
                          <div className="text-xs text-gray-500">
                            Visitantes empresariales
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Visitantes normales DENTRO */}
              <div className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                      <UserCircleIcon className="h-6 w-6 text-blue-700" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-600 truncate">
                          Normales (Dentro)
                        </dt>
                        <dd>
                          <div className="text-lg font-bold text-gray-900">
                            {stats.regularVisitorsInside}
                          </div>
                          <div className="text-xs text-gray-500">
                            Visitantes regulares
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Visitantes temporales DENTRO */}
              <div className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                      <ClockIcon className="h-6 w-6 text-yellow-700" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-600 truncate">
                          Temporales (Dentro)
                        </dt>
                        <dd>
                          <div className="text-lg font-bold text-gray-900">
                            {stats.temporaryVisitorsInside}
                          </div>
                          <div className="text-xs text-gray-500">
                            Visitantes temporales
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Aforo del edificio - MEJORADO Y PERSISTENTE */}
            <div className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
              <div className="px-6 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-semibold text-gray-800">
                  Aforo del Edificio (Persistente)
                </h3>
                <div className="mt-4 flex justify-between items-center">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{occupancyData.total}</p>
                    <div className="mt-1 text-sm text-gray-600">
                      <p>Personas actualmente dentro</p>
                      <p className="text-sm mt-1">
                        {occupancyData.residents} residentes + {occupancyData.visitors} visitantes
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Última actualización: {new Date().toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center shadow">
                    <UserGroupIcon className="h-8 w-8 text-green-700" />
                  </div>
                </div>
                <div className="mt-6">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-gray-600 bg-gray-200">
                          Ocupación
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-gray-600">
                          {Math.min((occupancyData.total / occupancyData.maxCapacity) * 100, 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-200">
                      <div
                        style={{ width: `${Math.min((occupancyData.total / occupancyData.maxCapacity) * 100, 100)}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                          occupancyData.total < occupancyData.maxCapacity * 0.5 ? 'bg-green-600' : 
                          occupancyData.total < occupancyData.maxCapacity * 0.8 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Registros de acceso recientes - EN TIEMPO REAL */}
            <div className="bg-white shadow-lg overflow-hidden rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-semibold text-gray-800 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Registros de Acceso Recientes
                  </h3>
                  <div className="flex items-center text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                    Tiempo Real
                  </div>
                </div>
              </div>
              <ul className="divide-y divide-gray-200">
                {stats.recentAccessLogs.length > 0 ? (
                  stats.recentAccessLogs.map((log) => (
                    <li key={log.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800">
                          {log.user_detail?.username || 'Visitante'}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            log.status === 'granted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {log.status === 'granted' ? 'Acceso concedido' : 'Acceso denegado'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            {log.access_point_detail?.name || 'Punto de acceso'}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p>
                            {new Date(log.timestamp).toLocaleString()} - {log.direction === 'in' ? 'Entrada' : 'Salida'}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-6 py-8 text-center text-gray-500 bg-gray-50">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="mt-2 font-medium">No hay registros de acceso recientes.</p>
                    <p className="mt-1 text-sm">Los registros aparecerán aquí cuando haya actividad.</p>
                  </li>
                )}
              </ul>
            </div>

            {/* Información sobre actualización automática */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">Dashboard en Tiempo Real</h4>
                  <div className="text-sm text-blue-700 mt-1">
                    <p>• Los datos se actualizan automáticamente cada 10 segundos</p>
                    <p>• Los conteos incluyen solo visitantes que están actualmente dentro del edificio</p>
                    <p>• El aforo se mantiene persistente entre sesiones</p>
                    <p>• Los registros de acceso se muestran en tiempo real</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}