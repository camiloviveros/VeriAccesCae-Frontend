'use client';

import { useState, FormEvent } from 'react';
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
  apartment_number: string;
  visitor_type: string;
  status: string;
}

export default function NewRegularVisitorPage() {
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    id_number: '',
    phone: '',
    apartment_number: '',
    visitor_type: 'regular',
    status: 'pending'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Create a FormData to send data
      const formDataToSend = new FormData();
      
      // Add each field to FormData
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      });

      // Call API to create visitor
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
            // Format validation errors
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
          <h1 className="text-2xl font-semibold text-gray-900">Registrar Visitante Normal</h1>
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

                <div className="sm:col-span-3">
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
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Número de Celular
                  </label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="apartment_number" className="block text-sm font-medium text-gray-700">
                    Número de Apartamento
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="apartment_number"
                      id="apartment_number"
                      required
                      value={formData.apartment_number}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
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