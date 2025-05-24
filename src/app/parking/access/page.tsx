// src/app/parking/access/page.tsx
'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { parkingService } from '../../../../lib/api';
import { Button } from '../../../../components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '../../../../components/ui/Alert';
import { Loading } from '../../../../components/ui/Loading';
import { formatDate } from '../../../../lib/utils';
import { isAdmin } from '../../../../lib/auth';

interface Vehicle {
  id: number;
  license_plate: string;
  brand: string;
  model: string;
  is_active: boolean;
}

interface ParkingArea {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

interface ParkingAccess {
  id: number;
  vehicle: number;
  vehicle_detail?: Vehicle;
  parking_area: number;
  parking_area_detail?: ParkingArea;
  valid_from: string;
  valid_to: string | null;
  is_active?: boolean;
}

export default function ParkingAccessPage() {
  const [accesses, setAccesses] = useState<ParkingAccess[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [areas, setAreas] = useState<ParkingArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const userIsAdmin = isAdmin();

  const [formData, setFormData] = useState({
    vehicle: '',
    parking_area: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Cargar accesos, vehículos y áreas en paralelo
      const [accessResponse, vehiclesResponse, areasResponse] = await Promise.all([
        parkingService.getParkingAccess({ active_only: 'true' }),
        parkingService.getVehicles(),
        parkingService.getParkingAreas()
      ]);
      
      // Procesar respuestas
      if (Array.isArray(accessResponse)) {
        setAccesses(accessResponse);
      } else if (accessResponse && accessResponse.results) {
        setAccesses(accessResponse.results);
      }
      
      if (Array.isArray(vehiclesResponse)) {
        setVehicles(vehiclesResponse.filter(v => v.is_active));
      } else if (vehiclesResponse && vehiclesResponse.results) {
        setVehicles(vehiclesResponse.results.filter(v => v.is_active));
      }
      
      if (Array.isArray(areasResponse)) {
        setAreas(areasResponse.filter(a => a.is_active));
      } else if (areasResponse && areasResponse.results) {
        setAreas(areasResponse.results.filter(a => a.is_active));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.vehicle || !formData.parking_area) {
      setError('Debe seleccionar un vehículo y un área');
      return;
    }
    
    try {
      const dataToSend: any = {
        vehicle: parseInt(formData.vehicle),
        parking_area: parseInt(formData.parking_area),
        valid_from: formData.valid_from
      };
      
      if (formData.valid_to) {
        dataToSend.valid_to = formData.valid_to;
      }
      
      await parkingService.createParkingAccess(dataToSend);
      setSuccess('Acceso creado correctamente');
      setShowModal(false);
      setFormData({
        vehicle: '',
        parking_area: '',
        valid_from: new Date().toISOString().split('T')[0],
        valid_to: ''
      });
      fetchData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error creating access:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data) {
        const errorMessages = Object.entries(err.response.data)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        setError(errorMessages || 'Error al crear el acceso');
      } else {
        setError('Error al crear el acceso');
      }
    }
  };

  const handleDelete = async (access: ParkingAccess) => {
    if (!confirm('¿Está seguro de eliminar este acceso?')) {
      return;
    }
    
    try {
      await parkingService.deleteParkingAccess(access.id);
      setSuccess('Acceso eliminado correctamente');
      fetchData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting access:', err);
      setError('Error al eliminar el acceso');
    }
  };

  const isAccessActive = (access: ParkingAccess) => {
    const today = new Date();
    const validFrom = new Date(access.valid_from);
    const validTo = access.valid_to ? new Date(access.valid_to) : null;
    
    return validFrom <= today && (!validTo || validTo >= today);
  };

  const groupedAccesses = accesses.reduce((groups, access) => {
    const vehicleId = access.vehicle;
    if (!groups[vehicleId]) {
      groups[vehicleId] = [];
    }
    groups[vehicleId].push(access);
    return groups;
  }, {} as Record<number, ParkingAccess[]>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Gestión de Accesos</h1>
            <p className="mt-1 text-sm text-gray-600">
              Administre los permisos de acceso de sus vehículos a las áreas de estacionamiento
            </p>
          </div>
          <Button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={vehicles.length === 0 || areas.length === 0}
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Acceso
          </Button>
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

        {vehicles.length === 0 && !loading && (
          <Alert variant="info">
            <AlertTitle>Sin vehículos</AlertTitle>
            <AlertDescription>
              Debe registrar al menos un vehículo antes de poder gestionar accesos.
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loading size="lg" message="Cargando accesos..." />
          </div>
        ) : Object.keys(groupedAccesses).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedAccesses).map(([vehicleId, vehicleAccesses]) => {
              const vehicle = vehicles.find(v => v.id === parseInt(vehicleId));
              if (!vehicle) return null;
              
              return (
                <div key={vehicleId} className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {vehicle.license_plate} - {vehicle.brand} {vehicle.model}
                    </h3>
                  </div>
                  <div className="border-t border-gray-200">
                    <ul className="divide-y divide-gray-200">
                      {vehicleAccesses.map((access) => {
                        const isActive = isAccessActive(access);
                        return (
                          <li key={access.id} className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <p className="text-sm font-medium text-gray-900">
                                    {access.parking_area_detail?.name || `Área ${access.parking_area}`}
                                  </p>
                                  <span className={`ml-3 px-2 py-1 text-xs leading-4 font-semibold rounded-full ${
                                    isActive 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {isActive ? 'Activo' : 'Inactivo'}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-500">
                                  Válido desde: {formatDate(access.valid_from)}
                                  {access.valid_to && ` hasta ${formatDate(access.valid_to)}`}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(access)}
                                className="border-red-300 text-red-700 hover:bg-red-50"
                              >
                                Eliminar
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="mt-2 text-gray-500">No hay accesos registrados</p>
              {vehicles.length > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  Cree un nuevo acceso para permitir que sus vehículos ingresen a las áreas de estacionamiento
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal para crear acceso */}
      {showModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={() => setShowModal(false)}
            ></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Nuevo Acceso de Estacionamiento
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Vehículo *
                      </label>
                      <select
                        required
                        value={formData.vehicle}
                        onChange={(e) => setFormData({...formData, vehicle: e.target.value})}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="">Seleccione un vehículo</option>
                        {vehicles.map(vehicle => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.license_plate} - {vehicle.brand} {vehicle.model}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Área de Estacionamiento *
                      </label>
                      <select
                        required
                        value={formData.parking_area}
                        onChange={(e) => setFormData({...formData, parking_area: e.target.value})}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="">Seleccione un área</option>
                        {areas.map(area => (
                          <option key={area.id} value={area.id}>
                            {area.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Válido desde *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.valid_from}
                        onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Válido hasta (opcional)
                      </label>
                      <input
                        type="date"
                        value={formData.valid_to}
                        onChange={(e) => setFormData({...formData, valid_to: e.target.value})}
                        min={formData.valid_from}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Deje en blanco para acceso permanente
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button
                    type="submit"
                    className="w-full sm:w-auto sm:ml-3"
                  >
                    Crear Acceso
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowModal(false)}
                    className="mt-3 w-full sm:mt-0 sm:w-auto"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}