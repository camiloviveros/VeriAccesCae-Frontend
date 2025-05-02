'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { accessService } from '../../../lib/api';
import StatCard from '../../../components/dashboard/StatCard';
import { Loading } from '../../../components/ui/Loading';
import { Alert } from '../../../components/ui/Alert';

// Tipos de visitantes
import { 
  UserCircleIcon, 
  BuildingOffice2Icon, 
  ClockIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline';

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

  // Función para escuchar cambios en el localStorage de occupancyCount
  useEffect(() => {
    const handleStorageChange = () => {
      const storedCount = localStorage.getItem('occupancyCount');
      if (storedCount) {
        setOccupancyCount(parseInt(storedCount, 10));
      }
    };

    // Agregar evento de escucha para cambios en localStorage
    window.addEventListener('storage', handleStorageChange);

    // Verificar valor inicial
    const storedCount = localStorage.getItem('occupancyCount');
    if (storedCount) {
      setOccupancyCount(parseInt(storedCount, 10));
    }

    // Limpiar listener al desmontar
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
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
                    ? v.status : undefined
          }));
        } else if (visitorsResponse && visitorsResponse.results && Array.isArray(visitorsResponse.results)) {
          visitors = visitorsResponse.results.map(v => ({
            ...v,
            status: (v.status === 'pending' || v.status === 'inside' || 
                    v.status === 'outside' || v.status === 'denied') 
                    ? v.status : undefined
          }));
        } else if (visitorsResponse && typeof visitorsResponse === 'object') {
          const possibleVisitors = Object.values(visitorsResponse).filter(val => 
            typeof val === 'object' && val !== null && 'id' in val
          );
          visitors = possibleVisitors as Visitor[];
        }
        
        // Obtener registros de acceso recientes
        const logsResponse = await accessService.getAccessLogs({ limit: 5 });
        let accessLogs: AccessLog[] = [];
        if (Array.isArray(logsResponse)) {
          accessLogs = logsResponse;
        } else if (logsResponse && logsResponse.results && Array.isArray(logsResponse.results)) {
          accessLogs = logsResponse.results;
        }
        
        // Calcular estadísticas
        const businessVisitors = visitors.filter(v => 
          v.visitor_type === 'business' || Boolean(v.company)
        ).length;
        
        const temporaryVisitors = visitors.filter(v => 
          v.visitor_type === 'temporary' || (Boolean(v.entry_date) && Boolean(v.exit_date))
        ).length;
        
        const regularVisitors = visitors.filter(v => 
          v.visitor_type === 'regular' || 
          (!v.visitor_type && !v.company && !v.entry_date && !v.exit_date)
        ).length;
        
        // Personas dentro del edificio (visitantes con acceso permitido)
        const visitorsInside = visitors.filter(v => v.status === 'inside').length;
        
        // Obtener el contador de aforo actual de localStorage si existe
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
        
        // Total de personas dentro = residentes (del contador de aforo) + visitantes
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
    
    fetchDashboardData();

    // Configurar un intervalo para actualizar los datos cada 10 segundos
    const intervalId = setInterval(fetchDashboardData, 10000);
    
    // Limpiar el intervalo al desmontar el componente
    return () => clearInterval(intervalId);
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        
        {error && <Alert variant="error">{error}</Alert>}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loading size="lg" message="Cargando datos del dashboard..." />
          </div>
        ) : (
          <>
            {/* Estadísticas principales */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total de visitantes */}
              <StatCard 
                title="Total de Visitantes" 
                value={stats.totalVisitors} 
                icon={<UserGroupIcon className="h-6 w-6 text-primary-600" />}
              />
              
              {/* Visitantes empresariales */}
              <StatCard 
                title="Visitantes Empresa" 
                value={stats.businessVisitors} 
                icon={<BuildingOffice2Icon className="h-6 w-6 text-green-600" />}
              />
              
              {/* Visitantes normales */}
              <StatCard 
                title="Visitantes Normales" 
                value={stats.regularVisitors} 
                icon={<UserCircleIcon className="h-6 w-6 text-blue-600" />}
              />
              
              {/* Visitantes temporales */}
              <StatCard 
                title="Visitantes Temporales" 
                value={stats.temporaryVisitors} 
                icon={<ClockIcon className="h-6 w-6 text-yellow-600" />}
              />
            </div>
            
            {/* Aforo del edificio */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Aforo del Edificio
                </h3>
                <div className="mt-2 flex justify-between items-center">
                  <div>
                    <p className="text-3xl font-semibold text-gray-900">{stats.peopleInside}</p>
                    <div className="mt-1 text-sm text-gray-500">
                      <p>Personas actualmente dentro</p>
                      <p className="text-xs mt-1">
                        {occupancyCount} residentes + {stats.visitorsInside} visitantes
                      </p>
                    </div>
                  </div>
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-3 text-xs flex rounded bg-gray-200">
                      <div
                        style={{ width: `${Math.min((stats.peopleInside / 100) * 100, 100)}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                          stats.peopleInside < 50 ? 'bg-green-500' : 
                          stats.peopleInside < 80 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Registros de acceso recientes */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Registros de acceso recientes
                </h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {stats.recentAccessLogs.length > 0 ? (
                  stats.recentAccessLogs.map((log) => (
                    <li key={log.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-primary-600">
                          {log.user_detail?.username || 'Visitante'}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            log.status === 'granted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {log.status === 'granted' ? 'Acceso concedido' : 'Acceso denegado'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
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
                  <li className="px-4 py-6 text-center text-gray-500">
                    No hay registros de acceso recientes.
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