'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../../../components/layout/DashboardLayout';
import { parkingService } from '../../../../../lib/api';
import { Button } from '../../../../../components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '../../../../../components/ui/Alert';

interface VehicleFormData {
  license_plate: string;
  brand: string;
  model: string;
  color: string;
}

export default function NewVehiclePage() {
  const [formData, setFormData] = useState<VehicleFormData>({
    license_plate: '',
    brand: '',
    model: '',
    color: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await parkingService.createVehicle(formData);
      router.push('/parking/vehicles');
    } catch (err: any) {
      console.error('Error creating vehicle:', err);
      
      // Manejar diferentes tipos de errores
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          setError(err.response.data);
        } else if (typeof err.response.data === 'object') {
          // Formatear errores de validación
          const errorMessages = Object.entries(err.response.data)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          setError(errorMessages || 'Error al registrar el vehículo');
        }
      } else {
        setError('Error al registrar el vehículo');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Registrar Nuevo Vehículo</h1>
        </div>

        {error && (
          <Alert variant="error">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="license_plate" className="block text-sm font-medium text-gray-700">
                    Placa
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="license_plate"
                      id="license_plate"
                      required
                      value={formData.license_plate}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="ABC-123"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                    Marca
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="brand"
                      id="brand"
                      required
                      value={formData.brand}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Toyota, Ford, Honda, etc."
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                    Modelo
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="model"
                      id="model"
                      required
                      value={formData.model}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Corolla, Mustang, Civic, etc."
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                    Color
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="color"
                      id="color"
                      required
                      value={formData.color}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Blanco, Negro, Rojo, etc."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  className="mr-3"
                  onClick={() => router.push('/parking/vehicles')}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={loading}
                  disabled={loading}
                >
                  Registrar Vehículo
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}