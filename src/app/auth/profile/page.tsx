'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { authService } from '../../../../lib/api';
import { getCurrentUser } from '../../../../lib/auth';
import { Alert, AlertTitle, AlertDescription } from '../../../../components/ui/Alert';
import { Button } from '../../../../components/ui/Button';

// Definición completa de la interfaz User con todas las propiedades posibles
interface User {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string; // Añadida propiedad phone
  is_active?: boolean;
  is_staff?: boolean;
  date_joined?: string;
  last_login?: string;
  role?: {
    id?: number;
    name?: string;
  };
  // Campo indexado para permitir acceso a propiedades no listadas explícitamente
  [key: string]: any;
}

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        // Intentar obtener datos del localStorage primero para rápido renderizado
        const storedUser = getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
          setFormData({
            first_name: storedUser.first_name || '',
            last_name: storedUser.last_name || '',
            email: storedUser.email || '',
            phone: storedUser.phone || ''
          });
        }
        
        // Actualizar desde la API
        const userData = await authService.getCurrentUser();
        setUser(userData);
        
        // Inicializar el formulario con datos del usuario
        setFormData({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          phone: userData.phone || ''
        });
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('No se pudo cargar el perfil del usuario');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');
    
    try {
      const updatedUser = await authService.updateProfile(formData);
      
      // Actualizar el estado y localStorage
      setUser(prev => {
        if (!prev) return updatedUser;
        return {
          ...prev,
          ...updatedUser
        };
      });
      
      // Actualizar localStorage con los datos actualizados
      const currentUser = getCurrentUser();
      if (currentUser) {
        const updatedLocalUser = {
          ...currentUser,
          ...updatedUser
        };
        localStorage.setItem('user', JSON.stringify(updatedLocalUser));
      }
      
      setSuccess('Perfil actualizado correctamente');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          setError(err.response.data);
        } else if (typeof err.response.data === 'object') {
          const errorMessages = Object.entries(err.response.data)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          setError(errorMessages || 'No se pudo actualizar el perfil');
        }
      } else {
        setError('No se pudo actualizar el perfil');
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Mi Perfil</h1>

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
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Información personal</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Actualiza tu información personal y de contacto.</p>
            </div>
            <div className="border-t border-gray-200">
              <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <label htmlFor="username" className="text-sm font-medium text-gray-500">Nombre de usuario</label>
                  <div className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user?.username}
                  </div>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <label htmlFor="first_name" className="text-sm font-medium text-gray-500">Nombre</label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <input
                      type="text"
                      name="first_name"
                      id="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="max-w-lg block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <label htmlFor="last_name" className="text-sm font-medium text-gray-500">Apellido</label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <input
                      type="text"
                      name="last_name"
                      id="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="max-w-lg block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <label htmlFor="email" className="text-sm font-medium text-gray-500">Email</label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="max-w-lg block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <label htmlFor="phone" className="text-sm font-medium text-gray-500">Teléfono</label>
                  <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="max-w-lg block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <label htmlFor="role" className="text-sm font-medium text-gray-500">Rol</label>
                  <div className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user?.role?.name || 'Usuario'}
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                  <Button
                    type="submit"
                    isLoading={updating}
                    disabled={updating}
                  >
                    {updating ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}