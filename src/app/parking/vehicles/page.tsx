// src/app/parking/vehicles/page.tsx
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
  is_active: boolean;
  user: number;
  created_at?: string;
  updated_at?: string;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError('No se pudieron cargar los vehículos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedVehicle) return;
    
    try {
      await parkingService.deleteVehicle(selectedVehicle.id);
      setVehicles(vehicles.filter(v => v.id !== selectedVehicle.id));
      setShowDeleteConfirm(false);
      setSelectedVehicle(null);
      setSuccess('Vehículo eliminado correctamente');
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      setError('Error al eliminar el vehículo. Por favor, intente nuevamente.');
      setShowDeleteConfirm(false);
    }
  };

  const handleToggleActive = async (vehicle: Vehicle) => {
    try {
      const updatedVehicle = await parkingService.updateVehicle(vehicle.id, {
        is_active: !vehicle.is_active
      });
      
      setVehicles(vehicles.map(v => 
        v.id === vehicle.id ? { ...v, is_active: updatedVehicle.is_active } : v
      ));
      
      setSuccess(`Vehículo ${updatedVehicle.is_active ? 'activado' : 'desactivado'} correctamente`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error toggling vehicle status:', err);
      setError('Error al cambiar el estado del vehículo');
    }
  };

  // Filtrar vehículos basado en búsqueda y estado
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = searchTerm === '' || 
      vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === 'all' ||
      (filterActive === 'active' && vehicle.is_active) ||
      (filterActive === 'inactive' && !vehicle.is_active);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Mis Vehículos</h1>
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
              Gestione los vehículos registrados para su acceso al estacionamiento.
            </p>
            
            {/* Filtros y búsqueda */}
            {!loading && vehicles.length > 0 && (
              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Buscar por placa, marca o modelo..."
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
                    Activos
                  </button>
                  <button
                    onClick={() => setFilterActive('inactive')}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      filterActive === 'inactive' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Inactivos
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
                            {vehicle.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {vehicle.brand} {vehicle.model} - {vehicle.color}
                        </p>
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
                          className={vehicle.is_active ? "border-yellow-500 text-yellow-700 hover:bg-yellow-50" : "border-green-500 text-green-700 hover:bg-green-50"}
                          onClick={() => handleToggleActive(vehicle)}
                        >
                          {vehicle.is_active ? 'Desactivar' : 'Activar'}
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
                          onClick={() => handleDeleteClick(vehicle)}
                        >
                          Eliminar
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
                  <span className="font-medium">{vehicles.length}</span> vehículo(s)
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
              <p className="mt-1 text-sm">Registra un vehículo para poder acceder al estacionamiento.</p>
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

      {/* Modal de confirmación para eliminación */}
      {showDeleteConfirm && selectedVehicle && (
        <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={() => setShowDeleteConfirm(false)}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Eliminar vehículo
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Está seguro que desea eliminar el vehículo con placa <span className="font-bold">{selectedVehicle.license_plate}</span>? 
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Esta acción no se puede deshacer y se eliminarán todos los registros de acceso asociados.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto sm:text-sm"
                  onClick={confirmDelete}
                >
                  Eliminar
                </Button>
                <Button
                  variant="secondary"
                  className="mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}