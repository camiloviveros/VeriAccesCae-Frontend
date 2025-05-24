'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '../../../../../../components/layout/DashboardLayout';
import { parkingService } from '../../../../../../lib/api';
import { Button } from '../../../../../../components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '../../../../../../components/ui/Alert';
import { Loading } from '../../../../../../components/ui/Loading';

interface VehicleFormData {
  license_plate: string;
  brand: string;
  model: string;
  color: string;
  is_active: boolean;
}

interface FormErrors {
  license_plate?: string;
  brand?: string;
  model?: string;
  color?: string;
}

const COMMON_BRANDS = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Mazda', 
  'Volkswagen', 'Hyundai', 'Kia', 'Subaru', 'BMW', 'Mercedes-Benz',
  'Audi', 'Lexus', 'Jeep', 'Ram', 'GMC', 'Dodge', 'Mitsubishi'
];

const COMMON_COLORS = [
  'Blanco', 'Negro', 'Gris', 'Plata', 'Rojo', 'Azul', 
  'Verde', 'Amarillo', 'Naranja', 'Café', 'Beige', 'Dorado'
];

export default function EditVehiclePage() {
  const [formData, setFormData] = useState<VehicleFormData>({
    license_plate: '',
    brand: '',
    model: '',
    color: '',
    is_active: true
  });
  const [originalData, setOriginalData] = useState<VehicleFormData | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;

  useEffect(() => {
    fetchVehicle();
  }, [vehicleId]);

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      const vehicle = await parkingService.getVehicle(vehicleId);
      
      const vehicleData: VehicleFormData = {
        license_plate: vehicle.license_plate,
        brand: vehicle.brand,
        model: vehicle.model,
        color: vehicle.color,
        is_active: vehicle.is_active
      };
      
      setFormData(vehicleData);
      setOriginalData(vehicleData);
    } catch (err) {
      console.error('Error fetching vehicle:', err);
      setError('No se pudo cargar la información del vehículo');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Validar placa
    if (!formData.license_plate.trim()) {
      newErrors.license_plate = 'La placa es requerida';
    } else if (formData.license_plate.length < 3) {
      newErrors.license_plate = 'La placa debe tener al menos 3 caracteres';
    } else if (!/^[A-Za-z0-9-]+$/.test(formData.license_plate)) {
      newErrors.license_plate = 'La placa solo puede contener letras, números y guiones';
    }
    
    // Validar marca
    if (!formData.brand.trim()) {
      newErrors.brand = 'La marca es requerida';
    } else if (formData.brand.length < 2) {
      newErrors.brand = 'La marca debe tener al menos 2 caracteres';
    }
    
    // Validar modelo
    if (!formData.model.trim()) {
      newErrors.model = 'El modelo es requerido';
    } else if (formData.model.length < 2) {
      newErrors.model = 'El modelo debe tener al menos 2 caracteres';
    }
    
    // Validar color
    if (!formData.color.trim()) {
      newErrors.color = 'El color es requerido';
    } else if (formData.color.length < 3) {
      newErrors.color = 'El color debe tener al menos 3 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Manejar checkbox para is_active
    const finalValue = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : name === 'license_plate' 
        ? value.toUpperCase() 
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
      await parkingService.updateVehicle(vehicleId, formData);
      setSuccess('Vehículo actualizado correctamente');
      
      // Actualizar datos originales
      setOriginalData(formData);
      
      // Redireccionar después de un breve retraso
      setTimeout(() => {
        router.push('/parking/vehicles');
      }, 1500);
    } catch (err: any) {
      console.error('Error updating vehicle:', err);
      
      if (err.message) {
        setError(err.message);
      } else {
        setError('Error al actualizar el vehículo. Por favor, intente nuevamente.');
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
          <Loading size="lg" message="Cargando información del vehículo..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Editar Vehículo</h1>
            <p className="mt-1 text-sm text-gray-600">
              Actualice la información de su vehículo
            </p>
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
                {/* Placa */}
                <div className="sm:col-span-3">
                  <label htmlFor="license_plate" className="block text-sm font-medium text-gray-700">
                    Placa <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="license_plate"
                      id="license_plate"
                      required
                      value={formData.license_plate}
                      onChange={handleChange}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        errors.license_plate ? 'border-red-300' : ''
                      }`}
                      placeholder="ABC-123"
                      maxLength={20}
                    />
                    {errors.license_plate && (
                      <p className="mt-1 text-sm text-red-600">{errors.license_plate}</p>
                    )}
                  </div>
                </div>

                {/* Marca */}
                <div className="sm:col-span-3">
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                    Marca <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="brand"
                      id="brand"
                      required
                      value={formData.brand}
                      onChange={handleChange}
                      list="brand-list"
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        errors.brand ? 'border-red-300' : ''
                      }`}
                      placeholder="Seleccione o escriba la marca"
                      maxLength={50}
                    />
                    <datalist id="brand-list">
                      {COMMON_BRANDS.map(brand => (
                        <option key={brand} value={brand} />
                      ))}
                    </datalist>
                    {errors.brand && (
                      <p className="mt-1 text-sm text-red-600">{errors.brand}</p>
                    )}
                  </div>
                </div>

                {/* Modelo */}
                <div className="sm:col-span-3">
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                    Modelo <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="model"
                      id="model"
                      required
                      value={formData.model}
                      onChange={handleChange}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        errors.model ? 'border-red-300' : ''
                      }`}
                      placeholder="Ej: Corolla, Civic, F-150"
                      maxLength={50}
                    />
                    {errors.model && (
                      <p className="mt-1 text-sm text-red-600">{errors.model}</p>
                    )}
                  </div>
                </div>

                {/* Color */}
                <div className="sm:col-span-3">
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                    Color <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="color"
                      id="color"
                      required
                      value={formData.color}
                      onChange={handleChange}
                      list="color-list"
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        errors.color ? 'border-red-300' : ''
                      }`}
                      placeholder="Seleccione o escriba el color"
                      maxLength={30}
                    />
                    <datalist id="color-list">
                      {COMMON_COLORS.map(color => (
                        <option key={color} value={color} />
                      ))}
                    </datalist>
                    {errors.color && (
                      <p className="mt-1 text-sm text-red-600">{errors.color}</p>
                    )}
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
                      <label htmlFor="is_active" className="font-medium text-gray-700">
                        Vehículo adentro del edificio
                      </label>
                      <p className="text-gray-500">
                        Marque si el vehículo está actualmente adentro del edificio
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen del vehículo */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Vista previa:</h4>
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Placa:</span> {formData.license_plate} | 
                  <span className="font-semibold ml-2">Vehículo:</span> {formData.brand} {formData.model} {formData.color} |
                  <span className="font-semibold ml-2">Estado:</span> {formData.is_active ? 'Adentro' : 'Afuera'}
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
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push('/parking/vehicles')}
                  disabled={saving}
                >
                  Cancelar
                </Button>
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
                  Guardar cambios
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}