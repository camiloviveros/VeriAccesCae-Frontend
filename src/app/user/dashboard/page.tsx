// src/app/user/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { accessService, securityService } from '../../../../lib/api';
import { Button } from '../../../../components/ui/Button';
import { Alert, AlertTitle } from '../../../../components/ui/Alert';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';

interface Visitor {
  id: number;
  first_name: string;
  last_name: string;
  status?: string;
  created_at: string;
}

export default function UserDashboardPage() {
  const router = useRouter();
  const [myVisitors, setMyVisitors] = useState<Visitor[]>([]);
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

    fetchMyVisitors();
  }, [router]);

  const fetchMyVisitors = async () => {
    try {
      setLoading(true);
      const response = await accessService.getVisitors();
      
      let visitorsList: Visitor[] = [];
      if (Array.isArray(response)) {
        visitorsList = response;
      } else if (response?.results && Array.isArray(response.results)) {
        visitorsList = response.results;
      } else if (response && typeof response === 'object') {
        visitorsList = Object.values(response).filter(val => 
          typeof val === 'object' && val !== null && 'id' in val
        ) as Visitor[];
      }
      
      setMyVisitors(visitorsList);
    } catch (err) {
      console.error('Error fetching visitors:', err);
      setError('No se pudieron cargar los visitantes');
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">VeriAccessSCAE</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/user/dashboard" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/user/visitors" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Mis Visitantes
                </Link>
                <Link href="/user/create-qr" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Generar QR
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <button 
                onClick={() => {
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  localStorage.removeItem('user');
                  router.push('/auth/login');
                }}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard de Usuario</h1>
          
          {error && (
            <Alert variant="error" className="mb-6">
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Quick Actions Card */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    onClick={() => router.push('/user/create-qr')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Generar Código QR para Visitante
                  </Button>
                  <Button 
                    onClick={() => router.push('/user/visitors')}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    Ver Mis Visitantes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Alert Card */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Enviar Alerta</CardTitle>
              </CardHeader>
              <CardContent>
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

          {/* Recent Visitors */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Mis Visitantes Recientes</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              {loading ? (
                <div className="p-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : myVisitors.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {myVisitors.slice(0, 5).map((visitor) => (
                    <li key={visitor.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {visitor.first_name} {visitor.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(visitor.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            visitor.status === 'inside' ? 'bg-green-100 text-green-800' : 
                            visitor.status === 'outside' ? 'bg-gray-100 text-gray-800' :
                            visitor.status === 'denied' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {visitor.status === 'inside' ? 'Dentro' : 
                             visitor.status === 'outside' ? 'Fuera' :
                             visitor.status === 'denied' ? 'Denegado' : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                  No ha registrado visitantes aún.
                </div>
              )}
              {myVisitors.length > 0 && (
                <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/user/visitors')}
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