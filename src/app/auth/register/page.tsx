'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '././../../../../lib/api';

// Define un tipo para la respuesta del registro
interface RegisterResponse {
  access?: string;
  refresh?: string;
  user?: any;
  [key: string]: any;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Efecto para probar la conexión al backend
  useEffect(() => {
    // Función para probar la conexión al backend
    const testBackend = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/auth/register/', {
          method: 'HEAD'
        });
        console.log('Backend connection test:', response.status);
      } catch (err) {
        console.error('Backend connection test failed:', err);
      }
    };
    
    testBackend();
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
    setLoading(true);
    setError('');
    
    try {
      console.log("Enviando datos de registro:", formData);
      const data = await authService.register(formData) as RegisterResponse;
      console.log("Respuesta del registro:", data);
      
      // Si el registro incluye tokens, guardarlos
      if (data.access && data.refresh) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        // Redireccionar al dashboard de usuario normal
        router.push('/user/dashboard');
      } else {
        // Si no hay tokens, redireccionar al login
        router.push('/auth/login');
      }
    } catch (err: any) {
      console.error("Error completo:", err);
      let errorMessage = 'Error al registrar usuario';
      
      if (err.response) {
        // Extraer el mensaje de error de la respuesta
        if (err.response.data) {
          if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          } else if (err.response.data.error) {
            errorMessage = err.response.data.error;
          } else if (err.response.data.detail) {
            errorMessage = err.response.data.detail;
          } else if (typeof err.response.data === 'object') {
            // Si es un objeto de errores de validación (común en DRF)
            const firstError = Object.entries(err.response.data)[0];
            if (firstError && Array.isArray(firstError[1])) {
              errorMessage = `${firstError[0]}: ${firstError[1][0]}`;
            }
          }
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-gray-800">
            Regístrate en VeriAccessSCAE
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Cree su cuenta para comenzar a usar el sistema de control de acceso
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}
        
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-gray-50 placeholder:text-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:text-sm"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-gray-50 placeholder:text-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:text-sm"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-gray-50 placeholder:text-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:text-sm"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-gray-50 placeholder:text-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:text-sm"
                  value={formData.first_name}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-gray-50 placeholder:text-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:text-sm"
                  value={formData.last_name}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-gray-50 placeholder:text-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:text-sm"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-gray-800 py-2 px-3 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-400 transition-all duration-300 transform hover:scale-105"
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </div>
          
          <div className="text-sm text-center mt-4">
            <Link href="/auth/login" className="font-medium text-gray-700 hover:text-gray-900 transition duration-300">
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}