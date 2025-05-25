'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { accessService } from '../../../lib/api';
import { Loading } from '../../../components/ui/Loading';
import { Alert, AlertTitle } from '../../../components/ui/Alert';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';

// Heroicons
import { 
  UserCircleIcon, 
  BuildingOffice2Icon, 
  ClockIcon, 
  UserGroupIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

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
  id: number;
  residents_count: number;
  visitors_count: number;
  total_count: number;
  max_capacity: number;
  last_updated: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalVisitorsInside: 0,
    businessVisitorsInside: 0,
    regularVisitorsInside: 0,
    temporaryVisitorsInside: 0,
    recentAccessLogs: [] as AccessLog[]
  });
  const [occupancyData, setOccupancyData] = useState<OccupancyData | null>(null);

  // Función para actualizar datos del dashboard
  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      
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
      
      // Obtener registros de acceso recientes
      const logsResponse = await accessService.getRecentAccessLogs(10);
      let accessLogs: AccessLog[] = [];
      if (Array.isArray(logsResponse)) {
        accessLogs = logsResponse;
      }
      
      // Obtener datos de aforo desde la API
      const occupancy = await accessService.getCurrentOccupancy();
      setOccupancyData(occupancy);
      
      setStats({
        totalVisitorsInside: visitorsInside.length,
        businessVisitorsInside,
        regularVisitorsInside,
        temporaryVisitorsInside,
        recentAccessLogs: accessLogs
      });
      
      setError('');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // useEffect para cargar datos iniciales y configurar actualización automática
  useEffect(() => {
    // Cargar datos iniciales
    fetchDashboardData();
    
    // Manejar cambios en eventos personalizados
    const handleVisitorChange = () => {
      console.log('Cambio detectado en visitantes, actualizando dashboard...');
      fetchDashboardData();
    };
    
    // Escuchar eventos personalizados
    window.addEventListener('visitorStatusChanged', handleVisitorChange);
    window.addEventListener('visitorDeleted', handleVisitorChange);
    window.addEventListener('visitorCreated', handleVisitorChange);
    
    // Configurar actualización automática cada 10 segundos
    const intervalId = setInterval(() => {
      console.log('Actualización automática del dashboard...');
      fetchDashboardData();
    }, 10000);
    
    // Limpiar listeners y timers
    return () => {
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
      <div className="space-y-6 p-6 bg-white">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
          <button
            onClick={handleManualRefresh}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:bg-gray-400"
            disabled={isRefreshing}
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
        
        {error && (
          <Alert variant="error" className="border-red-300 bg-red-50">
            <AlertTitle className="text-red-800">{error}</AlertTitle>
          </Alert>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
            <Loading size="lg" message="Cargando datos del dashboard..." />
          </div>
        ) : (
          <>
            {/* Estadísticas principales - SOLO VISITANTES DENTRO */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total de visitantes DENTRO */}
              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200">
                <CardContent className="p-6">
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
                          <div className="text-2xl font-bold text-gray-900">
                            {stats.totalVisitorsInside}
                          </div>
                          <div className="text-xs text-gray-500">
                            Actualmente en el edificio
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Visitantes empresariales DENTRO */}
              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200">
                <CardContent className="p-6">
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
                          <div className="text-2xl font-bold text-gray-900">
                            {stats.businessVisitorsInside}
                          </div>
                          <div className="text-xs text-gray-500">
                            Visitantes empresariales
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Visitantes normales DENTRO */}
              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200">
                <CardContent className="p-6">
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
                          <div className="text-2xl font-bold text-gray-900">
                            {stats.regularVisitorsInside}
                          </div>
                          <div className="text-xs text-gray-500">
                            Visitantes regulares
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Visitantes temporales DENTRO */}
              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200">
                <CardContent className="p-6">
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
                          <div className="text-2xl font-bold text-gray-900">
                            {stats.temporaryVisitorsInside}
                          </div>
                          <div className="text-xs text-gray-500">
                            Visitantes temporales
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Aforo del edificio - DESDE LA BASE DE DATOS */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200">
              <CardHeader className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    Aforo del Edificio (Base de Datos)
                  </CardTitle>
                  <div className="flex items-center text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                    Tiempo Real
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {occupancyData?.total_count || 0}
                    </p>
                    <div className="mt-1 text-sm text-gray-600">
                      <p>Personas actualmente dentro</p>
                      <p className="text-sm mt-1">
                        {occupancyData?.residents_count || 0} residentes + {occupancyData?.visitors_count || 0} visitantes
                      </p>
                      {occupancyData && (
                        <p className="text-xs text-gray-500 mt-1">
                          Última actualización: {new Date(occupancyData.last_updated).toLocaleString()}
                        </p>
                      )}
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
                          {occupancyData ? Math.min((occupancyData.total_count / occupancyData.max_capacity) * 100, 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-200">
                      <div
                        style={{ width: `${occupancyData ? Math.min((occupancyData.total_count / occupancyData.max_capacity) * 100, 100) : 0}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                          occupancyData && occupancyData.total_count < occupancyData.max_capacity * 0.5 ? 'bg-green-600' : 
                          occupancyData && occupancyData.total_count < occupancyData.max_capacity * 0.8 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <span className="text-sm text-gray-600">
                      Capacidad máxima: {occupancyData?.max_capacity || 100} personas
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Registros de acceso recientes - EN TIEMPO REAL */}
            <Card className="bg-white shadow-lg rounded-lg border border-gray-200">
              <CardHeader className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Registros de Acceso Recientes
                    </CardTitle>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                    Tiempo Real
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {stats.recentAccessLogs.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {stats.recentAccessLogs.map((log) => (
                      <li key={log.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-800">
                            {log.user_detail?.username || 'Visitante'}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              log.status === 'granted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {log.status === 'granted' ? '✅ Acceso concedido' : '❌ Acceso denegado'}
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
                              {new Date(log.timestamp).toLocaleString()} - {log.direction === 'in' ? '🚪→ Entrada' : '🚪← Salida'}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500 bg-gray-50">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="mt-2 font-medium">No hay registros de acceso recientes.</p>
                    <p className="mt-1 text-sm">Los registros aparecerán aquí cuando haya actividad.</p>
                  </div>
                )}
              </CardContent>
            </Card>

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
                    <p>• El aforo se obtiene directamente de la base de datos</p>
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