'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '../../../../../../components/layout/DashboardLayout';
import { parkingService } from '../../../../../../lib/api';
import { Button } from '../../../../../../components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '../../../../../../components/ui/Alert';
import { Loading } from '../../../../../../components/ui/Loading';
import Link from 'next/link';

interface FormData {
  name: string;
  description: string;
  max_capacity: number;
  is_active: boolean;
}

interface FormErrors {
  name?: string;
  max_capacity?: string;
}

export default function EditParkingAreaPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    max_capacity: 50,
    is_active: true
  });
  const [originalData, setOriginalData] = useState<FormData | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const router = useRouter();
  const params = useParams();
  const areaId = params.id as string;

  useEffect(() => {
    fetchArea();
  }, [areaId]);

  const fetchArea = async () => {
    try {
      setLoading(true);
      const area = await parkingService.getParkingArea(areaId);
      
      const areaData: FormData = {
        name: area.name,
        description: area.description || '',
        max_capacity: area.max_capacity,
        is_active: area.is_active
      };
      
      setFormData(areaData);
      setOriginalData(areaData);
    } catch (err) {
      console.error('Error fetching area:', err);
      setError('No se pudo cargar la información del área');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }
    
    if (!formData.max_capacity || formData.max_capacity < 1) {
      newErrors.max_capacity = 'La capacidad debe ser mayor a 0';
    } else if (formData.max_capacity > 10000) {
      newErrors.max_capacity = 'La capacidad no puede ser mayor a 10,000';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    const finalValue = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : type === 'number'
        ? parseInt(value) || 0
        : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await parkingService.updateParkingArea(areaId, formData);
      setSuccess('Área actualizada correctamente');
      
      // Actualizar datos originales
      setOriginalData(formData);
      
      // Redireccionar después de un breve retraso
      setTimeout(() => {
        router.push('/parking/areas');
      }, 1500);
    } catch (err: any) {
      console.error('Error updating area:', err);
      
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          const errorMessages = Object.entries(err.response.data)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          setError(errorMessages || 'Error al actualizar el área');
        } else {
          setError(err.response.data);
        }
      } else {
        setError('Error al actualizar el área. Por favor, intente nuevamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (!originalData) return false;
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  const handleReset = () => {
    if (originalData) {
      setFormData(originalData);
      setErrors({});
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loading size="lg" message="Cargando información del área..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link 
              href="/parking/areas"
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Editar Área de Estacionamiento</h1>
              <p className="mt-1 text-sm text-gray-600">
                Actualice la información del área
              </p>
            </div>
          </div>
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
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Nombre */}
                <div className="sm:col-span-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        errors.name ? 'border-red-300' : ''
                      }`}
                      placeholder="Ej: Estacionamiento Principal"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>
                </div>

                {/* Capacidad */}
                <div className="sm:col-span-2">
                  <label htmlFor="max_capacity" className="block text-sm font-medium text-gray-700">
                    Capacidad Máxima <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="max_capacity"
                      id="max_capacity"
                      required
                      min="1"
                      max="10000"
                      value={formData.max_capacity}
                      onChange={handleChange}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        errors.max_capacity ? 'border-red-300' : ''
                      }`}
                    />
                    {errors.max_capacity && (
                      <p className="mt-1 text-sm text-red-600">{errors.max_capacity}</p>
                    )}
                  </div>
                </div>

                {/* Descripción */}
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
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Descripción opcional del área"
                    />
                  </div>
                </div>

                {/* Estado */}
                <div className="sm:col-span-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="is_active"
                        name="is_active"
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="is_active" className="font-medium text-gray-700">Área activa</label>
                      <p className="text-gray-500">Indica si esta área está operativa</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vista previa */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Vista previa:</h4>
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Nombre:</span> {formData.name} | 
                  <span className="font-semibold ml-2">Capacidad:</span> {formData.max_capacity} vehículos |
                  <span className="font-semibold ml-2">Estado:</span> {formData.is_active ? 'Activa' : 'Inactiva'}
                </p>
              </div>

              {hasChanges() && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-sm text-yellow-800">
                    Tienes cambios sin guardar
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Link
                  href="/parking/areas"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </Link>
                {hasChanges() && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={saving}
                  >
                    Deshacer cambios
                  </Button>
                )}
                <Button
                  type="submit"
                  isLoading={saving}
                  disabled={saving || !hasChanges()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}