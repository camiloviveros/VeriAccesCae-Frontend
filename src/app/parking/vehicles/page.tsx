'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { parkingService } from '../../../../lib/api';
import Link from 'next/link';

// Definición de tipos
interface Vehicle {
  id: number;
  license_plate: string;
  brand: string;
  model: string;
  color: string;
  is_active: boolean;
  user: number;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
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
        setError('No se pudieron cargar los vehículos');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Mis Vehículos</h1>
          <Link 
            href="/parking/vehicles/new" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Registrar Vehículo
          </Link>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {loading ? (
            <div className="p-6 animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : vehicles.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {vehicles.map((vehicle) => (
                <li key={vehicle.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{vehicle.license_plate}</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {vehicle.brand} {vehicle.model} - {vehicle.color}
                      </p>
                    </div>
                    <div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        vehicle.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {vehicle.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Link
                      href={`/parking/vehicles/${vehicle.id}`}
                      className="text-sm text-primary-600 hover:text-primary-900"
                    >
                      Ver detalles
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No tienes vehículos registrados. Registra uno para poder acceder al estacionamiento.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}