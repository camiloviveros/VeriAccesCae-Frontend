'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { accessService } from '../../../../lib/api';
import { Button } from '../../../../components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '../../../../components/ui/Alert';

interface AccessPointFormData {
  name: string;
  description: string;
  location: string;
  max_capacity: number;
  is_active: boolean;
}

export default function NewAccessPointPage() {
  const [formData, setFormData] = useState<AccessPointFormData>({
    name: '',
    description: '',
    location: '',
    max_capacity: 0,
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Manejar checkboxes
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } 
    // Manejar campos numéricos
    else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value, 10) || 0
      }));
    } 
    // Otros campos de texto
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Intentar crear un nuevo punto de acceso
      await accessService.createAccessPoint(formData);
      router.push('/access');
    } catch (err: any) {
      console.error('Error creating access point:', err);
      
      // Manejar diferentes tipos de errores
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          setError(err.response.data);
        } else if (typeof err.response.data === 'object') {
          // Formatear errores de validación
          const errorMessages = Object.entries(err.response.data)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          setError(errorMessages || 'Error al crear el punto de acceso');
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Error al crear el punto de acceso');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Crear Nuevo Punto de Acceso</h1>
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
                <div className="sm:col-span-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Ubicación
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="location"
                      id="location"
                      required
                      value={formData.location}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="max_capacity" className="block text-sm font-medium text-gray-700">
                    Capacidad máxima
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="max_capacity"
                      id="max_capacity"
                      min="0"
                      value={formData.max_capacity}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">0 = sin límite</p>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="is_active"
                        name="is_active"
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="is_active" className="font-medium text-gray-700">Activo</label>
                      <p className="text-gray-500">Indica si este punto de acceso está activo y operativo.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push('/access')}
                  className="mr-3"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={loading}
                  disabled={loading}
                >
                  Crear Punto de Acceso
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}