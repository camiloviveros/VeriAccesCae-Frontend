'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { parkingService } from '../../../../lib/api';
import { Button } from '../../../../components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '../../../../components/ui/Alert';
import { Loading } from '../../../../components/ui/Loading';
import Link from 'next/link';

interface ParkingArea {
  id: number;
  name: string;
  description?: string;
  max_capacity: number;
  current_count: number;
  is_active: boolean;
}

export default function ParkingAreasPage() {
  const [areas, setAreas] = useState<ParkingArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      setError('');
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

  const handleDelete = async (area: ParkingArea) => {
    if (!confirm(`¿Está seguro de eliminar el área "${area.name}"?`)) {
      return;
    }
    
    try {
      await parkingService.deleteParkingArea(area.id);
      setSuccess('Área eliminada correctamente');
      await fetchAreas();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting parking area:', err);
      setError('Error al eliminar el área de estacionamiento');
    }
  };

  const getOccupancyPercentage = (area: ParkingArea) => {
    return Math.round((area.current_count / area.max_capacity) * 100);
  };

  const getOccupancyColor = (area: ParkingArea) => {
    const percentage = getOccupancyPercentage(area);
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

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
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Áreas de Estacionamiento</h1>
              <p className="mt-1 text-sm text-gray-600">
                Gestione las áreas de estacionamiento del edificio
              </p>
            </div>
          </div>
          <Link 
            href="/parking/areas/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Área
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

        {loading ? (
          <div className="flex justify-center py-10">
            <Loading size="lg" message="Cargando áreas..." />
          </div>
        ) : areas.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((area) => (
              <div 
                key={area.id} 
                className={`bg-white overflow-hidden shadow-lg rounded-lg border hover:shadow-xl transition-shadow ${!area.is_active ? 'opacity-60' : ''}`}
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
                  
                  <div className="mt-5 flex space-x-3">
                    <Link
                      href={`/parking/areas/${area.id}/edit`}
                      className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Editar
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(area)}
                      className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Eliminar
                    </Button>
                  </div>
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
            <Link
              href="/parking/areas/new"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Crear primera área
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}