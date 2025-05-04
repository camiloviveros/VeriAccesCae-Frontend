// src/app/dashboard/page.tsx (versión mejorada)
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
  status?: 'pending' | 'inside' | 'outside' | 'denied';
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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalVisitors: 0,
    businessVisitors: 0,
    regularVisitors: 0,
    temporaryVisitors: 0,
    peopleInside: 0,
    visitorsInside: 0,
    recentAccessLogs: [] as AccessLog[]
  });
  const [occupancyCount, setOccupancyCount] = useState(0);

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
                  v.status === 'outside' || v.status === 'denied') 
                  ? v.status : 'pending'
        }));
      } else if (visitorsResponse && visitorsResponse.results && Array.isArray(visitorsResponse.results)) {
        visitors = visitorsResponse.results.map(v => ({
          ...v,
          status: (v.status === 'pending' || v.status === 'inside' || 
                  v.status === 'outside' || v.status === 'denied') 
                  ? v.status : 'pending'
        }));
      } else if (visitorsResponse && typeof visitorsResponse === 'object') {
        const possibleVisitors = Object.values(visitorsResponse).filter(val => 
          typeof val === 'object' && val !== null && 'id' in val
        );
        visitors = possibleVisitors as Visitor[];
      }
      
      // Obtener registros de acceso recientes - ahora con un límite mayor
      const logsResponse = await accessService.getAccessLogs({ limit: 10 });
      let accessLogs: AccessLog[] = [];
      if (Array.isArray(logsResponse)) {
        accessLogs = logsResponse;
      } else if (logsResponse && logsResponse.results && Array.isArray(logsResponse.results)) {
        accessLogs = logsResponse.results;
      }
      
      // Filtrar los logs para mantener solo los más recientes
      accessLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      accessLogs = accessLogs.slice(0, 5); // Mantener solo los 5 más recientes
      
      // Calcular estadísticas correctamente basadas en el status real
      // Los visitantes de empresa son aquellos con visitor_type = 'business' o con un company definido
      const businessVisitors = visitors.filter(v => 
        v.visitor_type === 'business' || Boolean(v.company)
      ).length;
      
      // Los visitantes temporales son aquellos con visitor_type = 'temporary' o con fechas de entrada/salida
      const temporaryVisitors = visitors.filter(v => 
        v.visitor_type === 'temporary' || (Boolean(v.entry_date) && Boolean(v.exit_date))
      ).length;
      
      // Los visitantes regulares son todos los demás
      const regularVisitors = visitors.filter(v => 
        v.visitor_type === 'regular' || 
        (!v.visitor_type && !v.company && !v.entry_date && !v.exit_date)
      ).length;
      
      // IMPORTANTE: Contar correctamente los visitantes dentro
      // Solo contar aquellos con status = 'inside'
      const visitorsInside = visitors.filter(v => v.status === 'inside').length;
      
      // Obtener el contador de aforo actual de localStorage
      let storedOccupancy = 0;
      try {
        const storedCount = localStorage.getItem('occupancyCount');
        if (storedCount) {
          storedOccupancy = parseInt(storedCount, 10);
          // Actualizar también el estado de occupancyCount
          setOccupancyCount(storedOccupancy);
        }
      } catch (err) {
        console.error('Error reading occupancy from localStorage:', err);
      }
      
      // Total de personas dentro = residentes (del contador de aforo) + visitantes dentro
      const totalPeopleInside = storedOccupancy + visitorsInside;
      
      setStats({
        totalVisitors: visitors.length,
        businessVisitors,
        regularVisitors,
        temporaryVisitors,
        peopleInside: totalPeopleInside,
        visitorsInside,
        recentAccessLogs: accessLogs
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  // useEffect para cargar datos iniciales y configurar eventos para actualización
  useEffect(() => {
    fetchDashboardData();
    
    // Cargar el contador de aforo del localStorage
    const storedCount = localStorage.getItem('occupancyCount');
    if (storedCount) {
      setOccupancyCount(parseInt(storedCount, 10));
    }
    
    // Manejar cambios en el localStorage (para mantener el dashboard actualizado)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'occupancyCount' || e.key === 'visitorsInside') {
        fetchDashboardData();
      }
    };
    
    // Escuchar cambios en localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Escuchar eventos personalizados para actualizaciones internas
    window.addEventListener('visitorStatusChanged', fetchDashboardData);
    window.addEventListener('visitorDeleted', fetchDashboardData);
    
    // Configurar actualización periódica cada 10 segundos
    const intervalId = setInterval(fetchDashboardData, 10000);
    
    // Limpiar listeners y timers
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('visitorStatusChanged', fetchDashboardData);
      window.removeEventListener('visitorDeleted', fetchDashboardData);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-800">Panel de Control</h1>
        
        {error && <Alert variant="error">{error}</Alert>}
        
        {loading ? (
          <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-md">
            <Loading size="lg" message="Cargando datos del dashboard..." />
          </div>
        ) : (
          <>
            {/* Estadísticas principales */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total de visitantes */}
              <div className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
                      <UserGroupIcon className="h-6 w-6 text-gray-700" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-600 truncate">
                          Total de Visitantes
                        </dt>
                        <dd>
                          <div className="text-lg font-bold text-gray-900">
                            {stats.totalVisitors}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Visitantes empresariales */}
              <div className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                      <BuildingOffice2Icon className="h-6 w-6 text-green-700" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-600 truncate">
                          Visitantes Empresa
                        </dt>
                        <dd>
                          <div className="text-lg font-bold text-gray-900">
                            {stats.businessVisitors}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Visitantes normales */}
              <div className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                      <UserCircleIcon className="h-6 w-6 text-blue-700" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-600 truncate">
                          Visitantes Normales
                        </dt>
                        <dd>
                          <div className="text-lg font-bold text-gray-900">
                            {stats.regularVisitors}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Visitantes temporales */}
              <div className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                      <ClockIcon className="h-6 w-6 text-yellow-700" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-600 truncate">
                          Visitantes Temporales
                        </dt>
                        <dd>
                          <div className="text-lg font-bold text-gray-900">
                            {stats.temporaryVisitors}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Aforo del edificio */}
            <div className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
              <div className="px-6 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-semibold text-gray-800">
                  Aforo del Edificio
                </h3>
                <div className="mt-4 flex justify-between items-center">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{stats.peopleInside}</p>
                    <div className="mt-1 text-sm text-gray-600">
                      <p>Personas actualmente dentro</p>
                      <p className="text-sm mt-1">
                        {occupancyCount} residentes + {stats.visitorsInside} visitantes
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
                          {Math.min((stats.peopleInside / 100) * 100, 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-200">
                      <div
                        style={{ width: `${Math.min((stats.peopleInside / 100) * 100, 100)}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                          stats.peopleInside < 50 ? 'bg-green-600' : 
                          stats.peopleInside < 80 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Registros de acceso recientes */}
            <div className="bg-white shadow-lg overflow-hidden rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-semibold text-gray-800 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Registros de acceso recientes
                </h3>
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
}