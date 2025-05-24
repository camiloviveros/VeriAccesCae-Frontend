'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { parkingService } from '../../../../lib/api';
import { Button } from '../../../../components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '../../../../components/ui/Alert';
import { Loading } from '../../../../components/ui/Loading';
import Link from 'next/link';
import { formatDate } from '../../../../lib/utils';

// Definición de tipos
interface Vehicle {
  id: number;
  license_plate: string;
  brand: string;
  model: string;
  color: string;
  parking_area: number;
  parking_area_detail?: {
    id: number;
    name: string;
    description?: string;
    max_capacity: number;
    current_count: number;
    available_spots: number;
  };
  is_active: boolean;
  user: number;
  created_at?: string;
  updated_at?: string;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const router = useRouter();

  useEffect(() => {
    fetchVehicles();
    
    // Escuchar eventos de actualización
    const handleVehicleUpdate = () => {
      fetchVehicles();
    };
    
    window.addEventListener('vehicleCreated', handleVehicleUpdate);
    window.addEventListener('vehicleUpdated', handleVehicleUpdate);
    window.addEventListener('vehicleDeleted', handleVehicleUpdate);
    
    return () => {
      window.removeEventListener('vehicleCreated', handleVehicleUpdate);
      window.removeEventListener('vehicleUpdated', handleVehicleUpdate);
      window.removeEventListener('vehicleDeleted', handleVehicleUpdate);
    };
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await parkingService.getVehicles();
      
      // Manejar la respuesta que puede ser un array o un objeto con resultados
      if (Array.isArray(response)) {
        setVehicles(response);
      } else if (response && response.results && Array.isArray(response.results)) {
        setVehicles(response.results);
      } else {
        console.warn('Formato de respuesta inesperado:', response);
        setVehicles([]);
      }
    } catch (err: any) {
      console.error('Error fetching vehicles:', err);
      setError('No se pudieron cargar los vehículos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vehicle: Vehicle) => {
    const confirmMessage = `¿Está seguro de eliminar el vehículo ${vehicle.license_plate}?\n\nEsto liberará un espacio en el área "${vehicle.parking_area_detail?.name || 'N/A'}".`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setDeleting(vehicle.id);
      setError('');
      
      await parkingService.deleteVehicle(vehicle.id);
      
      // Actualizar la lista eliminando el vehículo
      setVehicles(vehicles.filter(v => v.id !== vehicle.id));
      setSuccess('Vehículo eliminado correctamente');
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error deleting vehicle:', err);
      
      // Mostrar error específico
      if (err.message) {
        setError(err.message);
      } else {
        setError('Error al eliminar el vehículo. Por favor, intente nuevamente.');
      }
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleAccess = async (vehicle: Vehicle) => {
    try {
      setError('');
      const updatedVehicle = await parkingService.updateVehicle(vehicle.id, {
        is_active: !vehicle.is_active
      });
      
      setVehicles(vehicles.map(v => 
        v.id === vehicle.id ? { ...v, is_active: updatedVehicle.is_active } : v
      ));
      
      setSuccess(`Vehículo ${updatedVehicle.is_active ? 'marcado como adentro' : 'marcado como afuera'} correctamente`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error toggling vehicle status:', err);
      setError('Error al cambiar el estado del vehículo');
    }
  };

  // Filtrar vehículos basado en búsqueda y estado
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = searchTerm === '' || 
      vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.parking_area_detail?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === 'all' ||
      (filterActive === 'active' && vehicle.is_active) ||
      (filterActive === 'inactive' && !vehicle.is_active);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link 
              href="/parking"
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900">Control de Vehículos</h1>
          </div>

          <Link 
            href="/parking/vehicles/new" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Registrar Vehículo
          </Link>
        </div>

        {error && (
          <Alert variant="error">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert variant="success">
            <AlertTitle>Éxito</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Vehículos Registrados
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Gestione los vehículos registrados para el control de acceso al edificio.
            </p>
            
            {/* Filtros y búsqueda */}
            {!loading && vehicles.length > 0 && (
              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Buscar por placa, marca, modelo o área..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterActive('all')}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      filterActive === 'all' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFilterActive('active')}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      filterActive === 'active' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Adentro
                  </button>
                  <button
                    onClick={() => setFilterActive('inactive')}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      filterActive === 'inactive' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Afuera
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="py-10 flex justify-center">
              <Loading size="lg" message="Cargando vehículos..." />
            </div>
          ) : filteredVehicles.length > 0 ? (
            <>
              <ul className="divide-y divide-gray-200">
                {filteredVehicles.map((vehicle) => (
                  <li key={vehicle.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-blue-600">{vehicle.license_plate}</h3>
                          <span className={`ml-3 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            vehicle.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {vehicle.is_active ? 'Adentro' : 'Afuera'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {vehicle.brand} {vehicle.model} - {vehicle.color}
                        </p>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="font-medium">Área:</span> {vehicle.parking_area_detail?.name || 'N/A'}
                          {vehicle.parking_area_detail && (
                            <span className="ml-2 text-xs">
                              ({vehicle.parking_area_detail.available_spots}/{vehicle.parking_area_detail.max_capacity} disponibles)
                            </span>
                          )}
                        </div>
                        {vehicle.created_at && (
                          <p className="mt-1 text-xs text-gray-500">
                            Registrado el {formatDate(vehicle.created_at)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className={vehicle.is_active ? "border-red-500 text-red-700 hover:bg-red-50" : "border-green-500 text-green-700 hover:bg-green-50"}
                          onClick={() => handleToggleAccess(vehicle)}
                        >
                          {vehicle.is_active ? 'Marcar Afuera' : 'Marcar Adentro'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          onClick={() => router.push(`/parking/vehicles/${vehicle.id}/edit`)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(vehicle)}
                          disabled={deleting === vehicle.id}
                          isLoading={deleting === vehicle.id}
                        >
                          {deleting === vehicle.id ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              
              {/* Resumen */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200">
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{filteredVehicles.length}</span> de{' '}
                  <span className="font-medium">{vehicles.length}</span> vehículo(s) •{' '}
                  <span className="font-medium text-green-600">
                    {vehicles.filter(v => v.is_active).length} adentro
                  </span> •{' '}
                  <span className="font-medium text-red-600">
                    {vehicles.filter(v => !v.is_active).length} afuera
                  </span>
                </p>
              </div>
            </>
          ) : vehicles.length > 0 ? (
            // Hay vehículos pero ninguno coincide con los filtros
            <div className="px-4 py-10 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2 font-medium">No se encontraron vehículos</p>
              <p className="mt-1 text-sm">Intenta ajustar los filtros de búsqueda.</p>
            </div>
          ) : (
            // No hay vehículos registrados
            <div className="px-4 py-10 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
              <p className="mt-2 font-medium">No tienes vehículos registrados</p>
              <p className="mt-1 text-sm">Registra un vehículo para poder controlar su acceso al edificio.</p>
              <div className="mt-5">
                <Link 
                  href="/parking/vehicles/new" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Registrar mi primer vehículo
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}