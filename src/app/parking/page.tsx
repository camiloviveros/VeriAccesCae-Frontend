'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { parkingService } from '../../../lib/api';
import { Loading } from '../../../components/ui/Loading';
import { formatDateTime } from '../../../lib/utils';
import Link from 'next/link';

interface DashboardStats {
  totalVehicles: number;
  vehiclesInside: number;
  vehiclesOutside: number;
  totalAreas: number;
  totalCapacity: number;
  currentOccupancy: number;
  recentLogs: any[];
  myVehicles: any[];
  parkingAreas: any[];
}

export default function ParkingDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    vehiclesInside: 0,
    vehiclesOutside: 0,
    totalAreas: 0,
    totalCapacity: 0,
    currentOccupancy: 0,
    recentLogs: [],
    myVehicles: [],
    parkingAreas: []
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos en paralelo
      const [vehiclesRes, areasRes] = await Promise.all([
        parkingService.getVehicles(),
        parkingService.getParkingAreas()
      ]);
      
      // Procesar vehículos
      const vehicles = Array.isArray(vehiclesRes) ? vehiclesRes : vehiclesRes.results || [];
      const vehiclesInside = vehicles.filter(v => v.is_active);
      const vehiclesOutside = vehicles.filter(v => !v.is_active);
      
      // Procesar áreas
      const areas = Array.isArray(areasRes) ? areasRes : areasRes.results || [];
      const activeAreas = areas.filter(a => a.is_active);
      
      // Calcular estadísticas
      const totalCapacity = activeAreas.reduce((sum, area) => sum + area.max_capacity, 0);
      const currentOccupancy = activeAreas.reduce((sum, area) => sum + area.current_count, 0);
      
      setStats({
        totalVehicles: vehicles.length,
        vehiclesInside: vehiclesInside.length,
        vehiclesOutside: vehiclesOutside.length,
        totalAreas: activeAreas.length,
        totalCapacity,
        currentOccupancy,
        recentLogs: [], // Quitamos logs
        myVehicles: vehicles.slice(0, 5), // Mostrar más vehículos
        parkingAreas: activeAreas
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOccupancyPercentage = () => {
    if (stats.totalCapacity === 0) return 0;
    return Math.round((stats.currentOccupancy / stats.totalCapacity) * 100);
  };

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <Loading size="lg" message="Cargando dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header con botón volver */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Control de Acceso Vehicular</h1>
            <p className="mt-1 text-sm text-gray-600">
              Resumen general del sistema de control de acceso
            </p>
          </div>
          <Link 
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Dashboard
          </Link>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Tarjeta Mis Vehículos */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Vehículos</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.totalVehicles}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/parking/vehicles" className="font-medium text-blue-600 hover:text-blue-500">
                  Ver vehículos →
                </Link>
              </div>
            </div>
          </div>

          {/* Tarjeta Vehículos Adentro */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Vehículos Adentro</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-green-600">{stats.vehiclesInside}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta Vehículos Afuera */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Vehículos Afuera</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-red-600">{stats.vehiclesOutside}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta Áreas Activas */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Áreas Activas</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.totalAreas}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/parking/areas" className="font-medium text-purple-600 hover:text-purple-500">
                  Ver áreas →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ENLACES RÁPIDOS - Solo Vehículos y Áreas */}
        <div className="bg-white shadow-lg rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">🚀 Accesos Rápidos</h2>
            <p className="mt-1 text-sm text-gray-600">
              Navegue rápidamente a las diferentes secciones del sistema
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Botón Mis Vehículos */}
              <Link 
                href="/parking/vehicles" 
                className="group relative rounded-xl border-2 border-gray-200 bg-white p-8 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">Mis Vehículos</p>
                    <p className="text-sm text-gray-500">Gestionar vehículos registrados</p>
                  </div>
                </div>
              </Link>

              {/* Botón Áreas de Acceso */}
              <Link 
                href="/parking/areas" 
                className="group relative rounded-xl border-2 border-gray-200 bg-white p-8 shadow-sm hover:border-purple-300 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-gray-900 group-hover:text-purple-600">Áreas de Acceso</p>
                    <p className="text-sm text-gray-500">Configurar zonas de estacionamiento</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Mis vehículos - Mostrar todos con estado */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Estado de Mis Vehículos</h3>
                <Link 
                  href="/parking/vehicles" 
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Ver todos
                </Link>
              </div>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {stats.myVehicles.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {stats.myVehicles.map((vehicle) => (
                    <li key={vehicle.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {vehicle.license_plate}
                          </p>
                          <p className="text-sm text-gray-500">
                            {vehicle.brand} {vehicle.model} - {vehicle.color}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          vehicle.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {vehicle.is_active ? 'Adentro' : 'Afuera'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No tienes vehículos registrados</p>
                  <Link 
                    href="/parking/vehicles/new" 
                    className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Registrar vehículo
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Resumen de estados */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Resumen de Estados</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-900">Vehículos Adentro</span>
                  </div>
                  <span className="text-lg font-semibold text-green-600">{stats.vehiclesInside}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-900">Vehículos Afuera</span>
                  </div>
                  <span className="text-lg font-semibold text-red-600">{stats.vehiclesOutside}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-900">Total de Vehículos</span>
                  </div>
                  <span className="text-lg font-semibold text-blue-600">{stats.totalVehicles}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estado de áreas */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Estado de Áreas</h3>
              <Link 
                href="/parking/areas" 
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Gestionar áreas
              </Link>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {stats.parkingAreas.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stats.parkingAreas.map((area) => {
                  const percentage = area.max_capacity > 0 
                    ? Math.round((area.current_count / area.max_capacity) * 100) 
                    : 0;
                  return (
                    <div key={area.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <Link href={`/parking/areas`}>
                        <h4 className="font-medium text-gray-900 hover:text-blue-600">{area.name}</h4>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Ocupación</span>
                            <span className="font-medium">
                              {area.current_count}/{area.max_capacity}
                            </span>
                          </div>
                          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                percentage >= 90 ? 'bg-red-600' :
                                percentage >= 70 ? 'bg-yellow-500' :
                                'bg-green-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No hay áreas de estacionamiento configuradas</p>
                <Link 
                  href="/parking/areas" 
                  className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  Configurar áreas
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}