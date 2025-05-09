'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { authService } from '../../lib/api';
import Notifications from '../ui/Notifications';

// Actualizado la importación de Heroicons
import { 
  HomeIcon, UsersIcon, ShieldCheckIcon, 
  DocumentTextIcon, TruckIcon, ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';

type User = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role?: {
    id: number;
    name: string;
  };
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Cargar usuario del localStorage primero para rápido renderizado
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing stored user:', err);
        localStorage.removeItem('user');
      }
    }

    // Verificar la sesión actual
    const verifySession = async () => {
      try {
        const userData = await authService.getCurrentUser() as User;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        console.error('Session verification failed:', error);
        // Si hay error, limpiar el almacenamiento y redirigir al login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [router]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      router.push('/auth/login');
    }
  };

  // Elementos de navegación
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Control de Acceso', href: '/access', icon: ShieldCheckIcon },
    { name: 'Visitantes', href: '/access/visitors', icon: UsersIcon },
    { name: 'Vehículos', href: '/parking/vehicles', icon: TruckIcon },
    { name: 'Seguridad', href: '/security', icon: ShieldCheckIcon },
    { name: 'Reportes', href: '/reports', icon: DocumentTextIcon },
  ];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar para desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white pt-5">
          <div className="flex flex-shrink-0 items-center px-4">
            <h1 className="text-xl font-bold text-gray-900">VeriAccessSCAE</h1>
          </div>
          <div className="mt-5 flex flex-grow flex-col">
            <nav className="flex-1 space-y-1 px-2 pb-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md
                    ${pathname.startsWith(item.href) 
                      ? 'bg-primary-100 text-primary-900' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <item.icon 
                    className={`
                      mr-3 h-5 w-5 flex-shrink-0
                      ${pathname.startsWith(item.href) 
                        ? 'text-primary-500' 
                        : 'text-gray-400 group-hover:text-gray-500'}
                    `} 
                    aria-hidden="true" 
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Barra superior y contenido principal */}
      <div className="flex flex-1 flex-col md:pl-64">
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow">
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1">
              {/* Espacio para búsqueda u otros controles */}
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notificaciones */}
              <Notifications />

              {/* Perfil de usuario */}
              <div className="relative ml-3">
                <div className="flex items-center">
                  <Link href="/auth/profile" className="mr-2 text-sm font-medium text-gray-700 hover:text-primary-600">
                    {user?.first_name} {user?.last_name}
                    <span className="text-xs text-gray-500 ml-1">
                      ({user?.role?.name || 'Usuario'})
                    </span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    <ArrowRightOnRectangleIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}