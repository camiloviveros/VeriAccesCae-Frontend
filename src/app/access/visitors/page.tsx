// src/app/access/visitors/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { accessService } from '../../../../lib/api';
import { Badge } from '../../../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Loading } from '../../../../components/ui/Loading';
import { Button } from '../../../../components/ui/Button';
import Link from 'next/link';

interface Visitor {
  id: number;
  id_number: string;
  first_name: string;
  last_name: string;
  photo?: string;
  company?: string;
  email?: string;
  phone?: string;
  visitor_type?: string;
  apartment_number?: string;
  status?: 'pending' | 'approved' | 'inside' | 'outside' | 'denied';
  created_at: string;
  entry_date?: string;
  exit_date?: string;
}

type FilterType = 'all' | 'pending' | 'approved' | 'denied';

export default function VisitorsPage() {
  const router = useRouter();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [filteredVisitors, setFilteredVisitors] = useState<Visitor[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVisitors();

    // Listen for changes
    const handleVisitorChange = () => {
      fetchVisitors();
    };

    window.addEventListener('visitorStatusChanged', handleVisitorChange);
    window.addEventListener('visitorDeleted', handleVisitorChange);
    
    return () => {
      window.removeEventListener('visitorStatusChanged', handleVisitorChange);
      window.removeEventListener('visitorDeleted', handleVisitorChange);
    };
  }, []);

  // Filter visitors when filter changes
  useEffect(() => {
    filterVisitors();
  }, [visitors, selectedFilter]);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const response = await accessService.getVisitors();
      
      // Función de tipo guard para verificar si es un Visitor
      const isVisitor = (obj: any): obj is Visitor => {
        return (
          typeof obj === 'object' &&
          obj !== null &&
          'id' in obj &&
          'id_number' in obj &&
          'first_name' in obj &&
          'last_name' in obj
        );
      };

      // Función para transformar la respuesta a Visitor[]
      const parseVisitors = (data: unknown): Visitor[] => {
        if (Array.isArray(data)) {
          return data.filter(isVisitor);
        }
        if (typeof data === 'object' && data !== null && 'results' in data) {
          const results = (data as { results: unknown }).results;
          if (Array.isArray(results)) {
            return results.filter(isVisitor);
          }
        }
        return [];
      };

      const visitorsList = parseVisitors(response);
      
      // Sort by creation date, newest first
      visitorsList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setVisitors(visitorsList);
    } catch (err) {
      console.error('Error fetching visitors:', err);
      setError('No se pudieron cargar los visitantes');
    } finally {
      setLoading(false);
    }
  };

  const filterVisitors = () => {
    switch (selectedFilter) {
      case 'pending':
        setFilteredVisitors(visitors.filter(v => v.status === 'pending'));
        break;
      case 'approved':
        setFilteredVisitors(visitors.filter(v => v.status === 'approved' || v.status === 'inside' || v.status === 'outside'));
        break;
      case 'denied':
        setFilteredVisitors(visitors.filter(v => v.status === 'denied'));
        break;
      default:
        setFilteredVisitors(visitors);
        break;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch(status) {
      case 'inside':
        return <Badge className="bg-green-500 text-white">Dentro</Badge>;
      case 'outside':
        return <Badge className="bg-green-600 text-white">Fuera</Badge>;
      case 'denied':
        return <Badge className="bg-red-500 text-white">Denegado</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500 text-white">Aprobado</Badge>;
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
        return visitors.filter(v => v.status === 'pending').length;
      case 'approved':
        return visitors.filter(v => v.status === 'approved' || v.status === 'inside' || v.status === 'outside').length;
      case 'denied':
        return visitors.filter(v => v.status === 'denied').length;
      default:
        return visitors.length;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              ← Volver al Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Gestión de Visitantes</h1>
              <p className="mt-1 text-sm text-gray-600">
                Administre todos los visitantes registrados en el sistema.
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={fetchVisitors}
              variant="outline"
              size="sm"
            >
              🔄 Actualizar
            </Button>
            <Link 
              href="/access/visitors/new" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ➕ Nuevo Visitante
            </Link>
            <Link 
              href="/access/control" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              🚪 Control de Acceso
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
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
                    <dt className="text-sm font-medium text-gray-600 truncate">Total de Visitantes</dt>
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
                    <dt className="text-sm font-medium text-gray-600 truncate">Pendientes de Aprobación</dt>
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
        <div className="bg-white shadow border border-gray-200 rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {[
                { key: 'all', label: 'Todos', count: getStatusCount('all') },
                { key: 'pending', label: 'Pendientes', count: getStatusCount('pending') },
                { key: 'approved', label: 'Aprobados', count: getStatusCount('approved') },
                { key: 'denied', label: 'Denegados', count: getStatusCount('denied') },
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

        {/* Visitors List */}
        <div className="bg-white shadow border border-gray-200 overflow-hidden sm:rounded-lg">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Loading size="lg" message="Cargando visitantes..." />
            </div>
          ) : filteredVisitors.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredVisitors.map((visitor) => (
                <li key={visitor.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                        {visitor.photo ? (
                          <img 
                            src={visitor.photo}
                            alt={`${visitor.first_name} ${visitor.last_name}`}
                            className="h-12 w-12 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span class="text-gray-600 text-xl font-medium">${visitor.first_name.charAt(0)}${visitor.last_name.charAt(0)}</span>
                                </div>`;
                              }
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 text-xl font-medium">
                              {visitor.first_name.charAt(0)}{visitor.last_name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            {visitor.first_name} {visitor.last_name}
                          </h3>
                          <span className="text-2xl">
                            {getVisitTypeIcon(visitor.visitor_type)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getVisitTypeName(visitor.visitor_type)}
                          </span>
                          {getStatusBadge(visitor.status)}
                        </div>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <p>ID: {visitor.id_number} | Tel: {visitor.phone || 'No proporcionado'}</p>
                          {visitor.email && <p>Email: {visitor.email}</p>}
                          {visitor.company && <p>Empresa: {visitor.company}</p>}
                          {visitor.apartment_number && <p>Apartamento: {visitor.apartment_number}</p>}
                          {visitor.visitor_type === 'temporary' && visitor.entry_date && visitor.exit_date && (
                            <p>
                              Período: {new Date(visitor.entry_date).toLocaleDateString()} - {new Date(visitor.exit_date).toLocaleDateString()}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            Registrado: {new Date(visitor.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link 
                        href={`/access/visitors/${visitor.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        👁️ Ver Detalles
                      </Link>
                      {/* NO HAY BOTÓN DE QR - Solo en la interfaz de usuario */}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedFilter === 'all' ? 'No hay visitantes registrados' : 
                 selectedFilter === 'pending' ? 'No hay visitantes pendientes' :
                 selectedFilter === 'approved' ? 'No hay visitantes aprobados' :
                 'No hay visitantes denegados'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {selectedFilter === 'all' ? 'Los visitantes aparecerán aquí cuando sean registrados.' : 
                 selectedFilter === 'pending' ? 'Todos los visitantes han sido procesados.' :
                 selectedFilter === 'approved' ? 'Aún no hay visitantes aprobados.' :
                 'Todos los visitantes han sido aprobados o están pendientes.'}
              </p>
              <Link href="/access/visitors/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Registrar Primer Visitante
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Information Card */}
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800">Gestión Administrativa de Visitantes</h4>
              <div className="text-sm text-yellow-700 mt-1 space-y-1">
                <p>• <strong>Desde Administración:</strong> Solo se pueden crear visitantes, NO generar códigos QR.</p>
                <p>• <strong>Códigos QR:</strong> Solo se generan desde la interfaz de usuario después de aprobación.</p>
                <p>• <strong>Control de Acceso:</strong> Use la sección correspondiente para aprobar/denegar visitantes.</p>
                <p>• <strong>Flujo:</strong> Crear visitante → Control de Acceso → Aprobar → Usuario genera QR → Escanear QR.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}