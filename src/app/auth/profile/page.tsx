'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { authService } from '../../../../lib/api';
import { getCurrentUser } from '../../../../lib/auth';
import { Alert, AlertTitle, AlertDescription } from '../../../../components/ui/Alert';
import { Button } from '../../../../components/ui/Button';

interface User {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
  is_staff?: boolean;
  date_joined?: string;
  last_login?: string;
  role?: {
    id?: number;
    name?: string;
  };
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
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        // Intentar obtener datos del localStorage primero
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
      
      setUser(prev => {
        if (!prev) return updatedUser;
        return {
          ...prev,
          ...updatedUser
        };
      });
      
      const currentUser = getCurrentUser();
      if (currentUser) {
        const updatedLocalUser = {
          ...currentUser,
          ...updatedUser
        };
        localStorage.setItem('user', JSON.stringify(updatedLocalUser));
      }
      
      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => setSuccess(''), 5000);
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

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U';
  };

  const isAdmin = user?.is_staff || user?.is_superuser || user?.role?.name === 'Administrator';

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-t-2xl shadow-xl overflow-hidden">
            {/* Background Gradient */}
            <div className="relative h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
              <div className="absolute inset-0 bg-black opacity-20"></div>
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-white" style={{clipPath: 'polygon(0 100%, 100% 100%, 100% 20%, 0 100%)'}}></div>
            </div>
            
            {/* Profile Picture */}
            <div className="relative px-8 pb-8">
              <div className="flex items-end space-x-6">
                <div className="relative -mt-16">
                  <div className="w-32 h-32 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-white">
                    <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-3xl font-bold">
                        {getInitials()}
                      </span>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex-1 pb-4">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {user?.first_name && user?.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : user?.username || 'Usuario'
                    }
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {user?.email || 'No hay email configurado'}
                  </p>
                  <div className="flex items-center space-x-4 mt-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      isAdmin 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isAdmin ? '👑 Administrador' : '👤 Usuario'}
                    </span>
                    {user?.role?.name && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {user.role.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white border-b border-gray-200">
            <nav className="flex space-x-8 px-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👤 Información Personal
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'security'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔐 Seguridad
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'stats'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 Estadísticas
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="bg-white rounded-b-2xl shadow-xl overflow-hidden">
            {/* Alerts */}
            {error && (
              <div className="p-6 border-b border-gray-200">
                <Alert variant="error">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            {success && (
              <div className="p-6 border-b border-gray-200">
                <Alert variant="success">
                  <AlertTitle>¡Éxito!</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              </div>
            )}

            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-gray-600 text-lg">Cargando perfil...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Form */}
                      <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre
                              </label>
                              <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Tu nombre"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Apellido
                              </label>
                              <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Tu apellido"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email
                            </label>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="tu@email.com"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Teléfono
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="+57 300 123 4567"
                            />
                          </div>

                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              isLoading={updating}
                              disabled={updating}
                              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                            >
                              {updating ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                          </div>
                        </form>
                      </div>

                      {/* Info Card */}
                      <div className="lg:col-span-1">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Cuenta</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-blue-100">
                              <span className="text-sm text-gray-600">Usuario:</span>
                              <span className="text-sm font-medium text-gray-900">{user?.username}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-blue-100">
                              <span className="text-sm text-gray-600">Estado:</span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                user?.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user?.is_active ? 'Activo' : 'Inactivo'}
                              </span>
                            </div>
                            {user?.date_joined && (
                              <div className="flex items-center justify-between py-2 border-b border-blue-100">
                                <span className="text-sm text-gray-600">Miembro desde:</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {new Date(user.date_joined).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            {user?.last_login && (
                              <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-600">Último acceso:</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {new Date(user.last_login).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="p-8">
                    <div className="max-w-2xl mx-auto">
                      <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mx-auto flex items-center justify-center mb-4">
                          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Configuración de Seguridad</h2>
                        <p className="text-gray-600 mt-2">Gestiona la seguridad de tu cuenta</p>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">Cambiar Contraseña</h3>
                              <p className="text-sm text-gray-600 mt-1">Actualiza tu contraseña para mantener tu cuenta segura</p>
                            </div>
                            <div>
                              <Button
                                onClick={() => window.location.href = '/auth/password'}
                                variant="outline"
                                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                              >
                                Cambiar
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">Sesiones Activas</h3>
                              <p className="text-sm text-gray-600 mt-1">Manage your active sessions across devices</p>
                            </div>
                            <div>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                1 sesión activa
                              </span>
                            </div>
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-purple-800">Cuenta de Administrador</h3>
                                <p className="text-sm text-purple-700 mt-1">
                                  Tu cuenta tiene privilegios administrativos. Ten cuidado con las acciones que realizas.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats Tab */}
                {activeTab === 'stats' && (
                  <div className="p-8">
                    <div className="max-w-4xl mx-auto">
                      <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mx-auto flex items-center justify-center mb-4">
                          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Estadísticas de Actividad</h2>
                        <p className="text-gray-600 mt-2">Resumen de tu actividad en el sistema</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-100 text-sm font-medium">Visitas Totales</p>
                              <p className="text-3xl font-bold">--</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-100 text-sm font-medium">Aprobadas</p>
                              <p className="text-3xl font-bold">--</p>
                            </div>
                            <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-yellow-100 text-sm font-medium">Pendientes</p>
                              <p className="text-3xl font-bold">--</p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-purple-100 text-sm font-medium">Este Mes</p>
                              <p className="text-3xl font-bold">--</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-8 text-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Estadísticas Detalladas</h3>
                        <p className="text-gray-600 mb-4">
                          Las estadísticas detalladas estarán disponibles próximamente
                        </p>
                        <Button variant="outline" disabled>
                          Ver Reportes Completos
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}