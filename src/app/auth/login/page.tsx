'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '././../../../../lib/api';

// Interfaces para tipar la respuesta del login
interface User {
  id: number;
  username: string;
  email: string;
  // Agrega aquí otras propiedades del usuario si las conoces
}

interface LoginResponse {
  access?: string;
  refresh?: string;
  user?: User;
}

interface ErrorResponse {
  response?: {
    data?: string | { 
      error?: string;
      detail?: string;
      non_field_errors?: string[];
      [key: string]: any;
    };
  };
  message?: string;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log("Intentando iniciar sesión con:", { username, password });
      const data = await authService.login(username, password) as LoginResponse;
      console.log("Respuesta del login:", data);
      
      // Guardar tokens en localStorage con verificación de existencia
      if (data.access) {
        localStorage.setItem('access_token', data.access);
      }
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      // Redireccionar al dashboard
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error("Error completo:", err);
      let errorMessage = 'Error al iniciar sesión';
      
      // Manejo seguro del error con type guards
      const error = err as ErrorResponse;
      
      if (error?.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.non_field_errors) {
          errorMessage = error.response.data.non_field_errors[0];
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-gray-800">
            Iniciar sesión en VeriAccessSCAE
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Acceda a su cuenta para gestionar los controles de acceso
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                className="relative block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-gray-50 placeholder:text-gray-500 focus:z-10 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:text-sm"
                placeholder="Ingrese su nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                className="relative block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-gray-50 placeholder:text-gray-500 focus:z-10 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:text-sm"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-gray-800 py-2 px-3 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-400 transition-all duration-300 transform hover:scale-105"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>
          
          <div className="text-sm text-center mt-6">
            <Link href="/auth/register" className="font-medium text-gray-700 hover:text-gray-900 transition duration-300">
              ¿No tienes cuenta? Regístrate
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}