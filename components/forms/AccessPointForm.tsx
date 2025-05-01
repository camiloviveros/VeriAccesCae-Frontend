'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { accessService } from '../../lib/api';

type AccessPointFormProps = {
  accessPointId?: string | number;
  isEdit?: boolean;
};

// Actualizado para coincidir con AccessPointResponse de lib/api.ts
interface AccessPoint {
  id: number;           // Cambiado de string a number para coincidir con la respuesta de la API
  name?: string;
  description?: string;
  location?: string;
  max_capacity?: number;
  is_active?: boolean;
  current_count?: number;
  created_at?: string;
  [key: string]: any;   // Permitir otras propiedades que pueda tener la respuesta
}

type FormDataType = {
  name: string;
  description: string;
  location: string;
  max_capacity: number;
  is_active: boolean;
};

export default function AccessPointForm({ accessPointId, isEdit = false }: AccessPointFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    description: '',
    location: '',
    max_capacity: 0,
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(isEdit);

  useEffect(() => {
    const fetchAccessPoint = async () => {
      if (isEdit && accessPointId) {
        try {
          setInitialLoading(true);
          
          // Obtener los puntos de acceso
          const response = await accessService.getAccessPoints();
          
          // Procesar la respuesta adecuadamente dependiendo de su formato
          let accessPoints: AccessPoint[] = [];
          
          if (Array.isArray(response)) {
            // Si es un array directo de puntos de acceso
            accessPoints = response;
          } else if (response.results && Array.isArray(response.results)) {
            // Si es una respuesta paginada
            accessPoints = response.results;
          }
          
          // Buscar el punto de acceso específico
          // Convertir accessPointId a número si es una cadena para comparación consistente
          const idToFind = typeof accessPointId === 'string' ? parseInt(accessPointId, 10) : accessPointId;
          const accessPoint = accessPoints.find(point => point.id === idToFind);
          
          if (accessPoint) {
            setFormData({
              name: accessPoint.name || '',
              description: accessPoint.description || '',
              location: accessPoint.location || '',
              max_capacity: accessPoint.max_capacity || 0,
              is_active: accessPoint.is_active !== undefined ? accessPoint.is_active : true
            });
          } else {
            throw new Error('Access point not found');
          }
        } catch (err) {
          console.error('Error fetching access point:', err);
          setError('No se pudo cargar la información del punto de acceso');
        } finally {
          setInitialLoading(false);
        }
      }
    };

    fetchAccessPoint();
  }, [isEdit, accessPointId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isEdit && accessPointId) {
        // Aquí idealmente habría un método en tu API para actualizar un punto de acceso
        // Por ejemplo: await accessService.updateAccessPoint(accessPointId, formData);
        console.log('Actualizando punto de acceso:', accessPointId, formData);
      } else {
        // Aquí idealmente habría un método en tu API para crear un punto de acceso
        // Por ejemplo: await accessService.createAccessPoint(formData);
        console.log('Creando nuevo punto de acceso:', formData);
      }
      router.push('/access');
    } catch (err) {
      console.error('Error saving access point:', err);
      setError('Error al guardar el punto de acceso');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}
      
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
        <button
          type="button"
          onClick={() => router.push('/access')}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
        >
          {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}