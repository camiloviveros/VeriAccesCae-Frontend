// src/app/user/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { accessService, securityService, authService } from '../../../../lib/api';
import { Button } from '../../../../components/ui/Button';
import { Alert, AlertTitle } from '../../../../components/ui/Alert';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';

interface Visit {
  id: number;
  first_name: string;
  last_name: string;
  status?: string;
  created_at: string;
  visitor_type?: string;
}

interface User {
  id: number;
  username: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  role?: {
    name: string;
  };
}

export default function UserDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [myVisits, setMyVisits] = useState<Visit[]>([]);
  const [pendingVisits, setPendingVisits] = useState<Visit[]>([]);
  const [approvedVisits, setApprovedVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [emergencyType, setEmergencyType] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Load user data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }

    fetchMyVisits();
    fetchCurrentUser();
  }, [router]);

  const fetchCurrentUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const fetchMyVisits = async () => {
    try {
      setLoading(true);
      const response = await accessService.getVisitors();
      
      let visitsList: Visit[] = [];
      if (Array.isArray(response)) {
        visitsList = response;
      } else if (response?.results && Array.isArray(response.results)) {
        visitsList = response.results;
      } else if (response && typeof response === 'object') {
        visitsList = Object.values(response).filter(val => 
          typeof val === 'object' && val !== null && 'id' in val
        ) as Visit[];
      }
      
      // Sort by creation date, newest first
      visitsList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setMyVisits(visitsList);
      setPendingVisits(visitsList.filter(v => v.status === 'pending'));
      setApprovedVisits(visitsList.filter(v => v.status === 'inside'));
    } catch (err) {
      console.error('Error fetching visits:', err);
      setError('No se pudieron cargar las visitas');
    } finally {
      setLoading(false);
    }
  };

  const submitEmergencyAlert = async () => {
    if (!emergencyMessage || !emergencyType) {
      setError('Por favor complete todos los campos de la alerta');
      return;
    }

    try {
      await securityService.createIncident({
        title: `Alerta: ${emergencyType}`,
        description: emergencyMessage,
        location: 'Reportado desde dashboard de usuario',
        severity: emergencyType === 'Emergencia' ? 'high' : 'medium'
      });

      setEmergencyMessage('');
      setEmergencyType('');
      setError('');
      alert('Alerta enviada correctamente');
    } catch (err) {
      console.error('Error sending alert:', err);
      setError('Error al enviar la alerta');
    }
  };

  const getStatusBadge = (status?: string) => {
    switch(status) {
      case 'inside':
        return <Badge variant="success">Dentro</Badge>;
      case 'outside':
        return <Badge variant="secondary">Fuera</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denegado</Badge>;
      default:
        return <Badge variant="info">Pendiente</Badge>;
    }
  };

  // Check if user is admin
  const isAdmin = user?.is_staff || user?.is_superuser || user?.role?.name === 'Administrator';

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-blue-600 shadow-sm text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">VeriAccessSCAE</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/user/dashboard" className="border-white text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/user/visits" className="border-transparent text-white hover:border-white hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Mis Visitas
                </Link>
                <Link href="/user/create-qr" className="border-transparent text-white hover:border-white hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Registrar Visita
                </Link>
                {isAdmin && (
                  <Link href="/dashboard" className="border-transparent text-yellow-200 hover:border-yellow-200 hover:text-yellow-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    ⚙️ Panel Admin
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm">
                {user?.username} 
                {isAdmin && <span className="ml-1 text-yellow-200">(Admin)</span>}
              </span>
              <button 
                onClick={() => {
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  localStorage.removeItem('user');
                  router.push('/auth/login');
                }}
                className="text-white hover:text-gray-200 text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard de Usuario</h1>
            {isAdmin && (
              <Link href="/dashboard">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  ⚙️ Ir al Panel de Administración
                </Button>
              </Link>
            )}
          </div>
          
          {error && (
            <Alert variant="error" className="mb-6">
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Quick Actions Card */}
            <Card className="bg-white shadow-lg border border-gray-200">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Button 
                    onClick={() => router.push('/user/create-qr')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Registrar Nueva Visita
                  </Button>
                  <Button 
                    onClick={() => router.push('/user/visits')}
                    className="w-full bg-gray-700 hover:bg-gray-800 text-white"
                  >
                    Ver Mis Visitas
                  </Button>
                  {isAdmin && (
                    <Button 
                      onClick={() => router.push('/dashboard')}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      ⚙️ Panel de Administración
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Alert Card */}
            <Card className="bg-white shadow-lg border border-gray-200">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle>Enviar Alerta</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tipo de Alerta
                    </label>
                    <select
                      value={emergencyType}
                      onChange={(e) => setEmergencyType(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="">Seleccione tipo</option>
                      <option value="Emergencia">Emergencia</option>
                      <option value="Seguridad">Incidente de Seguridad</option>
                      <option value="Reporte">Reporte General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Mensaje
                    </label>
                    <textarea
                      value={emergencyMessage}
                      onChange={(e) => setEmergencyMessage(e.target.value)}
                      rows={3}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                      placeholder="Describa la situación..."
                    />
                  </div>
                  <Button 
                    onClick={submitEmergencyAlert}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    Enviar Alerta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rest of the component remains the same */}
          {/* Visitas Pendientes */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Visitas Pendientes de Aprobación</h2>
            <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg border border-gray-200">
              {loading ? (
                <div className="p-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : pendingVisits.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {pendingVisits.slice(0, 3).map((visit) => (
                    <li key={visit.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-500 font-medium">
                                {visit.first_name.charAt(0)}{visit.last_name.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-900">
                                {visit.first_name} {visit.last_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Registrado: {new Date(visit.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div>
                          {getStatusBadge(visit.status)}
                          <p className="text-xs text-gray-500 mt-1 text-center">En revisión</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                  No tienes visitas pendientes de aprobación.
                </div>
              )}
              {pendingVisits.length > 3 && (
                <div className="bg-gray-50 px-4 py-3 text-right sm:px-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/user/visits')}
                    className="text-blue-600"
                  >
                    Ver Todos
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Visitas Activas */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Visitas Activas</h2>
            <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg border border-gray-200">
              {loading ? (
                <div className="p-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : approvedVisits.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {approvedVisits.slice(0, 3).map((visit) => (
                    <li key={visit.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-500 font-medium">
                                {visit.first_name.charAt(0)}{visit.last_name.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-900">
                                {visit.first_name} {visit.last_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Registrado: {new Date(visit.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/user/visits/${visit.id}/qr`)}
                          className="text-blue-600"
                        >
                          Ver QR
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                  No tienes visitas activas actualmente.
                  <div className="mt-3">
                    <Link href="/user/create-qr">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        Registrar Primera Visita
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
              {approvedVisits.length > 3 && (
                <div className="bg-gray-50 px-4 py-3 text-right sm:px-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/user/visits')}
                    className="text-blue-600"
                  >
                    Ver Todos
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}