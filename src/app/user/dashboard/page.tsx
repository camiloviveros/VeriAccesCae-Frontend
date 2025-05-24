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
  apartment_number?: string;
  company?: string;
  entry_date?: string;
  exit_date?: string;
  id_number?: string;
  phone?: string;
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
  const [deniedVisits, setDeniedVisits] = useState<Visit[]>([]);
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

    // Listen for changes
    const handleVisitChange = () => {
      fetchMyVisits();
    };

    window.addEventListener('visitorStatusChanged', handleVisitChange);
    window.addEventListener('visitorDeleted', handleVisitChange);
    
    return () => {
      window.removeEventListener('visitorStatusChanged', handleVisitChange);
      window.removeEventListener('visitorDeleted', handleVisitChange);
    };
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
      
      // Los visitantes aprobados son aquellos con estado 'approved'
      setApprovedVisits(visitsList.filter(v => v.status === 'approved'));
      
      setDeniedVisits(visitsList.filter(v => v.status === 'denied'));
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
        return <Badge className="bg-green-600 text-white">Dentro del edificio</Badge>;
      case 'outside':
        return <Badge className="bg-gray-600 text-white">Fuera del edificio</Badge>;
      case 'approved':
        return <Badge className="bg-blue-600 text-white">Aprobado - Generar QR</Badge>;
      case 'denied':
        return <Badge className="bg-red-600 text-white">Denegado</Badge>;
      default:
        return <Badge className="bg-yellow-600 text-white">Pendiente</Badge>;
    }
  };

  const getVisitTypeName = (type?: string) => {
    switch(type) {
      case 'temporary':
        return 'Temporal';
      case 'business':
        return 'Empresarial';
      case 'regular':
        return 'Normal';
      default:
        return 'Normal';
    }
  };

  const getVisitTypeIcon = (type?: string) => {
    switch(type) {
      case 'temporary':
        return '⏰';
      case 'business':
        return '🏢';
      default:
        return '🏠';
    }
  };

  // Check if user is admin
  const isAdmin = user?.is_staff || user?.is_superuser || user?.role?.name === 'Administrator';

  // CORREGIDO: Función para determinar si se puede mostrar QR
  const canShowQR = (visit: Visit) => {
    // Solo se puede mostrar QR si el visitante está aprobado
    return visit.status === 'approved';
  };

  const getStatusDescription = (status?: string) => {
    switch(status) {
      case 'inside':
        return '✅ Su visitante está dentro del edificio';
      case 'outside':
        return '✅ Su visitante está fuera del edificio';
      case 'approved':
        return '✅ Aprobado - Puede generar código QR para el acceso';
      case 'denied':
        return '❌ Acceso denegado por administración';
      default:
        return '⏳ Esperando aprobación de administración';
    }
  };

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
                <Link href="/user/create-visit" className="border-transparent text-white hover:border-white hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
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
            <Alert variant="error" className="mb-6 border-red-500 bg-red-50">
              <AlertTitle className="text-red-800">Error</AlertTitle>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Quick Actions Card */}
            <Card className="bg-white shadow-lg border border-gray-200">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="text-gray-900">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Button 
                    onClick={() => router.push('/user/create-visit')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    📋 Registrar Nueva Visita
                  </Button>
                  <Button 
                    onClick={() => router.push('/user/visits')}
                    className="w-full bg-gray-700 hover:bg-gray-800 text-white"
                  >
                    👥 Ver Mis Visitas
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
                <CardTitle className="text-gray-900">Enviar Alerta</CardTitle>
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
                    🚨 Enviar Alerta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Estadísticas de visitas */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-4">
            <Card className="bg-white shadow-lg border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xl font-bold">{myVisits.length}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-600 truncate">Total de Visitas</dt>
                      <dd className="text-lg font-medium text-gray-900">{myVisits.length}</dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 text-xl font-bold">{pendingVisits.length}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-600 truncate">Visitas Pendientes</dt>
                      <dd className="text-lg font-medium text-gray-900">{pendingVisits.length}</dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xl font-bold">{approvedVisits.length}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-600 truncate">Visitas Aprobadas</dt>
                      <dd className="text-lg font-medium text-gray-900">{approvedVisits.length}</dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-xl font-bold">{deniedVisits.length}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-600 truncate">Visitas Denegadas</dt>
                      <dd className="text-lg font-medium text-gray-900">{deniedVisits.length}</dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
                  {pendingVisits.slice(0, 5).map((visit) => (
                    <li key={visit.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                              <span className="text-2xl">
                                {getVisitTypeIcon(visit.visitor_type)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-900">
                                {visit.first_name} {visit.last_name}
                              </p>
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {getVisitTypeName(visit.visitor_type)}
                                </span>
                                <p className="text-xs text-gray-500">
                                  {new Date(visit.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              {visit.entry_date && visit.exit_date && (
                                <p className="text-xs text-gray-500">
                                  Válido: {new Date(visit.entry_date).toLocaleDateString()} - {new Date(visit.exit_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          {getStatusBadge(visit.status)}
                          <p className="text-xs text-gray-500 mt-1">{getStatusDescription(visit.status)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                  <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium mb-2 text-gray-700">No tienes visitas pendientes</p>
                  <p className="text-sm text-gray-600">Las visitas aparecerán aquí cuando las registres.</p>
                </div>
              )}
              {pendingVisits.length > 5 && (
                <div className="bg-gray-50 px-4 py-3 text-right sm:px-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/user/visits')}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    Ver Todas las Visitas
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Visitas Aprobadas (QR Disponible) */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Visitas Aprobadas (QR Disponible)</h2>
            <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg border border-gray-200">
              {loading ? (
                <div className="p-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : approvedVisits.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {approvedVisits.slice(0, 5).map((visit) => (
                    <li key={visit.id} className="px-4 py-4 sm:px-6 hover:bg-green-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-2xl">
                                {getVisitTypeIcon(visit.visitor_type)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-900">
                                {visit.first_name} {visit.last_name}
                              </p>
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {getVisitTypeName(visit.visitor_type)}
                                </span>
                                <p className="text-xs text-gray-600">
                                  {new Date(visit.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              {visit.entry_date && visit.exit_date && (
                                <p className="text-xs text-gray-600">
                                  Válido: {new Date(visit.entry_date).toLocaleDateString()} - {new Date(visit.exit_date).toLocaleDateString()}
                                </p>
                              )}
                              <p className="text-xs text-green-600 mt-1">{getStatusDescription(visit.status)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(visit.status)}
                          {canShowQR(visit) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/user/visits/${visit.id}/qr`)}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              📱 Ver QR
                            </Button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                  <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium mb-2 text-gray-700">No tienes visitas aprobadas</p>
                  <p className="text-sm text-gray-600">Las visitas aparecerán aquí cuando sean aprobadas por administración.</p>
                  <div className="mt-3">
                    <Link href="/user/create-visit">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        Registrar Primera Visita
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
              {approvedVisits.length > 5 && (
                <div className="bg-gray-50 px-4 py-3 text-right sm:px-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/user/visits')}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    Ver Todas las Visitas
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Información sobre el proceso */}
          <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">Proceso de Visitas</h4>
                <div className="text-sm text-blue-700 mt-1 space-y-1">
                  <p>1. <strong>Registro:</strong> Solicite una nueva visita desde "Registrar Visita"</p>
                  <p>2. <strong>Aprobación:</strong> El administrador revisará y aprobará su solicitud</p>
                  <p>3. <strong>Código QR:</strong> Una vez aprobada, podrá generar el código QR</p>
                  <p>4. <strong>Acceso:</strong> Su visitante usa el QR para ingresar al edificio</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}