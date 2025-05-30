'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { parkingService } from '../../../../lib/api';
import { Button } from '../../../../components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '../../../../components/ui/Alert';
import { Loading } from '../../../../components/ui/Loading';
import Link from 'next/link';

interface VehicleFormData {
  license_plate: string;
  brand: string;
  model: string;
  color: string;
  parking_area: string;
}

interface FormErrors {
  license_plate?: string;
  brand?: string;
  model?: string;
  color?: string;
  parking_area?: string;
}

interface ParkingArea {
  id: number;
  name: string;
  description?: string;
  max_capacity: number;
  current_count: number;
  available_spots: number;
  is_active: boolean;
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

export default function NewVehiclePage() {
  const [formData, setFormData] = useState<VehicleFormData>({
    license_plate: '',
    brand: '',
    model: '',
    color: '',
    parking_area: ''
  });
  const [areas, setAreas] = useState<ParkingArea[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchParkingAreas();
  }, []);

  const fetchParkingAreas = async () => {
    try {
      setLoadingAreas(true);
      const response = await parkingService.getAvailableParkingAreas();
      setAreas(response);
    } catch (err) {
      console.error('Error fetching parking areas:', err);
      setError('No se pudieron cargar las áreas de estacionamiento');
    } finally {
      setLoadingAreas(false);
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
    
    // Validar área de estacionamiento
    if (!formData.parking_area) {
      newErrors.parking_area = 'Debe seleccionar un área de estacionamiento';
    } else {
      const selectedArea = areas.find(area => area.id === parseInt(formData.parking_area));
      if (selectedArea && selectedArea.available_spots <= 0) {
        newErrors.parking_area = 'El área seleccionada no tiene espacios disponibles';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Formatear placa a mayúsculas
    const formattedValue = name === 'license_plate' ? value.toUpperCase() : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
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
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const vehicleData = {
        ...formData,
        parking_area: parseInt(formData.parking_area)
      };
      
      await parkingService.createVehicle(vehicleData);
      setSuccess('Vehículo registrado correctamente');
      
      // Redireccionar después de un breve retraso para mostrar el mensaje de éxito
      setTimeout(() => {
        router.push('/parking/vehicles');
      }, 1500);
    } catch (err: any) {
      console.error('Error creating vehicle:', err);
      
      // Manejar diferentes tipos de errores
      if (err.message) {
        setError(err.message);
      } else if (err.response?.data) {
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
        setError('Error al registrar el vehículo. Por favor, intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.license_plate.trim() && 
           formData.brand.trim() && 
           formData.model.trim() && 
           formData.color.trim() &&
           formData.parking_area;
  };

  const getSelectedArea = () => {
    return areas.find(area => area.id === parseInt(formData.parking_area));
  };

  if (loadingAreas) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loading size="lg" message="Cargando áreas de estacionamiento..." />
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
              href="/parking/vehicles"
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Registrar Nuevo Vehículo</h1>
              <p className="mt-1 text-sm text-gray-600">
                Complete la información de su vehículo para registrarlo en el sistema
              </p>
            </div>
          </div>
        </div>

        {areas.length === 0 && (
          <Alert variant="error">
            <AlertTitle>Sin áreas disponibles</AlertTitle>
            <AlertDescription>
              No hay áreas de estacionamiento disponibles. Contacte al administrador para crear áreas.
            </AlertDescription>
          </Alert>
        )}

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
                      autoFocus
                    />
                    {errors.license_plate && (
                      <p className="mt-1 text-sm text-red-600">{errors.license_plate}</p>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Ingrese la placa sin espacios (ej: ABC-123 o ABC123)
                  </p>
                </div>

                {/* Área de Estacionamiento */}
                <div className="sm:col-span-3">
                  <label htmlFor="parking_area" className="block text-sm font-medium text-gray-700">
                    Área de Estacionamiento <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <select
                      name="parking_area"
                      id="parking_area"
                      required
                      value={formData.parking_area}
                      onChange={handleChange}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        errors.parking_area ? 'border-red-300' : ''
                      }`}
                      disabled={areas.length === 0}
                    >
                      <option value="">Seleccione un área</option>
                      {areas.map(area => (
                        <option 
                          key={area.id} 
                          value={area.id}
                          disabled={area.available_spots <= 0}
                        >
                          {area.name} ({area.available_spots}/{area.max_capacity} disponibles)
                          {area.available_spots <= 0 && ' - LLENO'}
                        </option>
                      ))}
                    </select>
                    {errors.parking_area && (
                      <p className="mt-1 text-sm text-red-600">{errors.parking_area}</p>
                    )}
                  </div>
                  {formData.parking_area && getSelectedArea() && (
                    <p className="mt-1 text-xs text-gray-500">
                      Área seleccionada: {getSelectedArea()?.name} - 
                      {getSelectedArea()?.available_spots} espacios disponibles
                    </p>
                  )}
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
                <div className="sm:col-span-6">
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
              </div>

              {/* Resumen del vehículo */}
              {isFormValid() && getSelectedArea() && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Vista previa del vehículo:</h4>
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">Placa:</span> {formData.license_plate} | 
                    <span className="font-semibold ml-2">Vehículo:</span> {formData.brand} {formData.model} {formData.color} |
                    <span className="font-semibold ml-2">Área:</span> {getSelectedArea()?.name}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Link
                  href="/parking/vehicles"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </Link>
                <Button
                  type="submit"
                  isLoading={loading}
                  disabled={loading || !isFormValid() || areas.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Registrando...' : 'Registrar Vehículo'}
                </Button>
              </div>
            </form>
          </div>

          {/* Información adicional */}
          <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Información importante:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Los campos marcados con <span className="text-red-500">*</span> son obligatorios</li>
                <li>La placa debe coincidir exactamente con la de su vehículo</li>
                <li>Debe seleccionar un área de estacionamiento con espacios disponibles</li>
                <li>Una vez registrado, tendrá acceso automático al área seleccionada</li>
                <li>Puede registrar múltiples vehículos en diferentes áreas</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Información de áreas disponibles */}
        {areas.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Áreas de Estacionamiento Disponibles
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Espacios disponibles en cada área
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                {areas.map((area, index) => (
                  <div key={area.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}>
                    <dt className="text-sm font-medium text-gray-500">{area.name}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <span>
                          {area.available_spots}/{area.max_capacity} espacios disponibles
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          area.available_spots > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {area.available_spots > 0 ? 'Disponible' : 'Lleno'}
                        </span>
                      </div>
                      {area.description && (
                        <p className="mt-1 text-xs text-gray-500">{area.description}</p>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
