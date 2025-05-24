// src/app/parking/areas/page.tsx
'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { parkingService } from '../../../../lib/api';
import { Button } from '../../../../components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '../../../../components/ui/Alert';
import { Loading } from '../../../../components/ui/Loading';
import { isAdmin } from '../../../../lib/auth';

interface ParkingArea {
  id: number;
  name: string;
  description?: string;
  max_capacity: number;
  current_count: number;
  is_active: boolean;
  available_spots?: number;
}

export default function ParkingAreasPage() {
  const [areas, setAreas] = useState<ParkingArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedArea, setSelectedArea] = useState<ParkingArea | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const userIsAdmin = isAdmin();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_capacity: 50,
    is_active: true
  });

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const response = await parkingService.getParkingAreas();
      
      if (Array.isArray(response)) {
        setAreas(response);
      } else if (response && response.results) {
        setAreas(response.results);
      } else {
        setAreas([]);
      }
    } catch (err) {
      console.error('Error fetching parking areas:', err);
      setError('No se pudieron cargar las áreas de estacionamiento');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode: 'create' | 'edit', area?: ParkingArea) => {
    setModalMode(mode);
    if (mode === 'edit' && area) {
      setSelectedArea(area);
      setFormData({
        name: area.name,
        description: area.description || '',
        max_capacity: area.max_capacity,
        is_active: area.is_active
      });
    } else {
      setSelectedArea(null);
      setFormData({
        name: '',
        description: '',
        max_capacity: 50,
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedArea(null);
    setFormData({
      name: '',
      description: '',
      max_capacity: 50,
      is_active: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (modalMode === 'create') {
        await parkingService.createParkingArea(formData);
        setSuccess('Área de estacionamiento creada correctamente');
      } else if (selectedArea) {
        await parkingService.updateParkingArea(selectedArea.id, formData);
        setSuccess('Área de estacionamiento actualizada correctamente');
      }
      
      handleCloseModal();
      fetchAreas();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving parking area:', err);
      setError('Error al guardar el área de estacionamiento');
    }
  };

  const handleDelete = async (area: ParkingArea) => {
    if (!confirm(`¿Está seguro de eliminar el área "${area.name}"?`)) {
      return;
    }
    
    try {
      await parkingService.deleteParkingArea(area.id);
      setSuccess('Área eliminada correctamente');
      fetchAreas();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting parking area:', err);
      setError('Error al eliminar el área de estacionamiento');
    }
  };

  const getOccupancyColor = (area: ParkingArea) => {
    const percentage = (area.current_count / area.max_capacity) * 100;
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getOccupancyPercentage = (area: ParkingArea) => {
    return Math.round((area.current_count / area.max_capacity) * 100);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Áreas de Estacionamiento</h1>
          {userIsAdmin && (
            <Button 
              onClick={() => handleOpenModal('create')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Área
            </Button>
          )}
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

        {loading ? (
          <div className="flex justify-center py-10">
            <Loading size="lg" message="Cargando áreas..." />
          </div>
        ) : areas.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((area) => (
              <div 
                key={area.id} 
                className={`bg-white overflow-hidden shadow rounded-lg ${!area.is_active ? 'opacity-60' : ''}`}
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{area.name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      area.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {area.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  
                  {area.description && (
                    <p className="text-sm text-gray-500 mb-4">{area.description}</p>
                  )}
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Ocupación</span>
                        <span className="font-medium">{area.current_count} / {area.max_capacity}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            getOccupancyPercentage(area) >= 90 ? 'bg-red-600' :
                            getOccupancyPercentage(area) >= 70 ? 'bg-yellow-500' :
                            'bg-green-600'
                          }`}
                          style={{ width: `${getOccupancyPercentage(area)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOccupancyColor(area)}`}>
                      {area.max_capacity - area.current_count} espacios disponibles
                    </div>
                  </div>
                  
                  {userIsAdmin && (
                    <div className="mt-5 flex space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenModal('edit', area)}
                        className="flex-1"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(area)}
                        className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Eliminar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="mt-2 text-gray-500">No hay áreas de estacionamiento registradas</p>
          </div>
        )}
      </div>

      {/* Modal para crear/editar área */}
      {showModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={handleCloseModal}
            ></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {modalMode === 'create' ? 'Nueva Área de Estacionamiento' : 'Editar Área de Estacionamiento'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Ej: Estacionamiento Principal"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Descripción
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={3}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Descripción opcional del área"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Capacidad Máxima *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.max_capacity}
                        onChange={(e) => setFormData({...formData, max_capacity: parseInt(e.target.value) || 0})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                        Área activa
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button
                    type="submit"
                    className="w-full sm:w-auto sm:ml-3"
                  >
                    {modalMode === 'create' ? 'Crear' : 'Guardar'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCloseModal}
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