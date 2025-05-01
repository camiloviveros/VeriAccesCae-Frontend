'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../../../../components/layout/DashboardLayout';
import { accessService } from '../../../../../../lib/api';
import { Alert, AlertTitle, AlertDescription } from '../../../../../../components/ui/Alert';
import { Button } from '../../../../../../components/ui/Button';

interface FormData {
  first_name: string;
  last_name: string;
  id_number: string;
  phone: string;
  email: string;
  company: string;
  photo: File | null;
  visitor_type: string;
}

export default function NewBusinessVisitorPage() {
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    id_number: '',
    phone: '',
    email: '',
    company: '',
    photo: null,
    visitor_type: 'business'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        photo: file
      }));
      
      // Crear URL para previsualización
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Crear un FormData para enviar correctamente los datos con archivos
      const formDataToSend = new FormData();
      
      // Añadir cada campo al FormData
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'photo' && value instanceof File) {
            formDataToSend.append(key, value);
          } else if (typeof value === 'string') {
            formDataToSend.append(key, value);
          }
        }
      });

      // Llamar a la API para crear un visitante
      await accessService.createVisitor(formDataToSend);
      router.push('/access/visitors');
    } catch (err: unknown) {
      console.error('Error creating visitor:', err);
      
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: any } };
        if (axiosError.response?.data) {
          if (typeof axiosError.response.data === 'string') {
            setError(axiosError.response.data);
          } else if (typeof axiosError.response.data === 'object') {
            // Formatear errores de validación
            const errorMessages = Object.entries(axiosError.response.data)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('; ');
            setError(errorMessages || 'Error al registrar visitante');
          }
        } else {
          setError('Error al registrar visitante');
        }
      } else {
        setError('Error al registrar visitante');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Registrar Visitante Empresarial</h1>
        </div>

        {error && (
          <Alert variant="error">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="first_name"
                      id="first_name"
                      required
                      value={formData.first_name}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Apellido
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="last_name"
                      id="last_name"
                      required
                      value={formData.last_name}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label htmlFor="id_number" className="block text-sm font-medium text-gray-700">
                    Número de Identificación
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="id_number"
                      id="id_number"
                      required
                      value={formData.id_number}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    Empresa
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="company"
                      id="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Foto
                  </label>
                  <div className="mt-1 flex items-center">
                    {photoPreview ? (
                      <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100">
                        <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        <svg className="h-12 w-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    )}
                    <div className="ml-5">
                      <div className="relative py-2 px-4 border border-gray-300 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                        <input 
                          id="photo" 
                          name="photo" 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handlePhotoChange}
                        />
                        <span className="text-sm font-medium text-gray-900">{photoPreview ? 'Cambiar foto' : 'Subir foto'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push('/access/visitors')}
                  className="mr-3"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={loading}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}