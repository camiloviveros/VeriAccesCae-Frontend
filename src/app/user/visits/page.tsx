'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { accessService } from '../../../../lib/api';
import { Button } from '../../../../components/ui/Button';
import { Alert, AlertTitle } from '../../../../components/ui/Alert';
import { Badge } from '../../../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';

interface Visit {
  id: number;
  first_name: string;
  last_name: string;
  status?: 'pending' | 'approved' | 'inside' | 'outside' | 'denied';
  created_at: string;
  visitor_type?: string;
  apartment_number?: string;
  company?: string;
  entry_date?: string;
  exit_date?: string;
  id_number?: string;
  phone?: string;
}

type FilterType = 'all' | 'pending' | 'approved' | 'denied';

export default function MyVisitsPage() {
  const router = useRouter();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchMyVisits();

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

  // Filter visits when filter changes
  useEffect(() => {
    filterVisits();
  }, [visits, selectedFilter]);

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
      
      setVisits(visitsList);
    } catch (err) {
      console.error('Error fetching visits:', err);
      setError('No se pudieron cargar las visitas');
    } finally {
      setLoading(false);
    }
  };

  const filterVisits = () => {
    switch (selectedFilter) {
      case 'pending':
        setFilteredVisits(visits.filter(v => v.status === 'pending'));
        break;
      case 'approved':
        setFilteredVisits(visits.filter(v => v.status === 'approved' || v.status === 'inside' || v.status === 'outside'));
        break;
      case 'denied':
        setFilteredVisits(visits.filter(v => v.status === 'denied'));
        break;
      default:
        setFilteredVisits(visits);
        break;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch(status) {
      case 'inside':
        return <Badge className="bg-green-500 text-white">Dentro del edificio</Badge>;
      case 'outside':
        return <Badge className="bg-gray-600 text-white">Fuera del edificio</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500 text-white">Aprobado - QR Disponible</Badge>;
      case 'denied':
        return <Badge className="bg-red-500 text-white">Denegado</Badge>;
      default:
        return <Badge className="bg-yellow-500 text-white">Pendiente</Badge>;
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

  const getStatusCount = (status: FilterType) => {
    switch (status) {
      case 'pending':
        return visits.filter(v => v.status === 'pending').length;
      case 'approved':
        return visits.filter(v => v.status === 'approved' || v.status === 'inside' || v.status === 'outside').length;
      case 'denied':
        return visits.filter(v => v.status === 'denied').length;
      default:
        return visits.length;
    }
  };

  const canShowQR = (visit: Visit) => {
    return visit.status === 'approved' || visit.status === 'inside' || visit.status === 'outside';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-blue-600 shadow-sm text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">VeriAccessSCAE</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/user/dashboard" className="border-transparent text-blue-100 hover:border-white hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/user/visits" className="border-white text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Mis Visitas
                </Link>
                <Link href="/user/create-visit" className="border-transparent text-blue-100 hover:border-white hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Registrar Visita
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
                className="text-blue-100 hover:text-white text-sm font-medium"
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
            <h1 className="text-2xl font-semibold text-gray-900">Mis Visitas</h1>
            <Button
              onClick={() => router.push('/user/create-visit')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              ➕ Nueva Visita
            </Button>
          </div>
          
          {error && (
            <Alert variant="error" className="mb-6 border-red-500 bg-red-50">
              <AlertTitle className="text-red-800">Error</AlertTitle>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </Alert>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
            <Card className="bg-white shadow border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xl font-bold">{getStatusCount('all')}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-600 truncate">Total de Visitas</dt>
                      <dd className="text-lg font-medium text-gray-900">{getStatusCount('all')}</dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 text-xl font-bold">{getStatusCount('pending')}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-600 truncate">Pendientes</dt>
                      <dd className="text-lg font-medium text-gray-900">{getStatusCount('pending')}</dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xl font-bold">{getStatusCount('approved')}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-600 truncate">Aprobadas</dt>
                      <dd className="text-lg font-medium text-gray-900">{getStatusCount('approved')}</dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-xl font-bold">{getStatusCount('denied')}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-600 truncate">Denegadas</dt>
                      <dd className="text-lg font-medium text-gray-900">{getStatusCount('denied')}</dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white shadow border border-gray-200 rounded-lg mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {[
                  { key: 'all', label: 'Todas', count: getStatusCount('all') },
                  { key: 'pending', label: 'Pendientes', count: getStatusCount('pending') },
                  { key: 'approved', label: 'Aprobadas', count: getStatusCount('approved') },
                  { key: 'denied', label: 'Denegadas', count: getStatusCount('denied') },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedFilter(tab.key as FilterType)}
                    className={`${
                      selectedFilter === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <span>{tab.label}</span>
                    <span className={`${
                      selectedFilter === tab.key
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-900'
                    } py-0.5 px-2.5 rounded-full text-xs font-medium`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Visits List */}
          <div className="bg-white shadow border border-gray-200 overflow-hidden sm:rounded-lg">
            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredVisits.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {filteredVisits.map((visit) => (
                  <li key={visit.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">
                            {getVisitTypeIcon(visit.visitor_type)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {visit.first_name} {visit.last_name}
                          </h3>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getVisitTypeName(visit.visitor_type)}
                            </span>
                            {getStatusBadge(visit.status)}
                          </div>
                          <div className="mt-2 text-sm text-gray-600 space-y-1">
                            <p>ID: {visit.id_number} | Tel: {visit.phone}</p>
                            {visit.apartment_number && (
                              <p>Apartamento: {visit.apartment_number}</p>
                            )}
                            {visit.visitor_type === 'temporary' && visit.entry_date && visit.exit_date && (
                              <p>
                                Período: {new Date(visit.entry_date).toLocaleDateString()} - {new Date(visit.exit_date).toLocaleDateString()}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Registrada: {new Date(visit.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/user/visits/${visit.id}`)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          👁️ Ver Detalles
                        </Button>
                        {canShowQR(visit) && (
                          <Button
                            size="sm"
                            onClick={() => router.push(`/user/visits/${visit.id}/qr`)}
                            className="bg-green-600 hover:bg-green-700 text-white"
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
              <div className="p-8 text-center text-gray-500">
                <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedFilter === 'all' ? 'No tienes visitas registradas' : 
                   selectedFilter === 'pending' ? 'No tienes visitas pendientes' :
                   selectedFilter === 'approved' ? 'No tienes visitas aprobadas' :
                   'No tienes visitas denegadas'}
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {selectedFilter === 'all' ? 'Comienza registrando tu primera visita.' : 
                   selectedFilter === 'pending' ? 'Todas tus visitas han sido procesadas.' :
                   selectedFilter === 'approved' ? 'Aún no tienes visitas aprobadas por el administrador.' :
                   'Todas tus visitas han sido aprobadas o están pendientes.'}
                </p>
                {selectedFilter === 'all' && (
                  <Button
                    onClick={() => router.push('/user/create-visit')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Registrar Primera Visita
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}