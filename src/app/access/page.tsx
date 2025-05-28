'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { accessService } from '../../../lib/api'; 
import { Alert, AlertTitle } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Loading } from '../../../components/ui/Loading';
import { Badge } from '../../../components/ui/Badge';
import Link from 'next/link';

interface Visitor {
  id: number;
  first_name: string;
  last_name: string;
  photo?: string;
  company?: string;
  apartment_number?: string;
  phone?: string;
  email?: string;
  visitor_type?: string;
  entry_date?: string;
  exit_date?: string;
  status?: 'pending' | 'inside' | 'outside' | 'denied';
}

interface BuildingOccupancy {
  id: number;
  residents_count: number;
  visitors_count: number;
  total_count: number;
  max_capacity: number;
  last_updated: string;
}

const parseVisitorStatus = (status?: string): 'pending' | 'inside' | 'outside' | 'denied' | undefined => {
  if (status === 'pending' || status === 'inside' || status === 'outside' || status === 'denied') {
    return status as 'pending' | 'inside' | 'outside' | 'denied';
  }
  return undefined;
};

const ensureVisitor = (visitor: any): Visitor => {
  const status = parseVisitorStatus(visitor.status);
  return {
    ...visitor,
    status: status || 'pending'
  };
};

export default function AccessControlPage() {
  const router = useRouter();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDeletingVisitor, setIsDeletingVisitor] = useState(false);
  const [peopleInside, setPeopleInside] = useState<Visitor[]>([]);
  const [occupancy, setOccupancy] = useState<BuildingOccupancy | null>(null);

  useEffect(() => {
    fetchVisitors();
    fetchOccupancy();
    
    // Configurar eventos para actualizar la lista cuando cambie el estado
    window.addEventListener('visitorStatusChanged', fetchVisitors);
    window.addEventListener('visitorDeleted', fetchVisitors);
    
    return () => {
      window.removeEventListener('visitorStatusChanged', fetchVisitors);
      window.removeEventListener('visitorDeleted', fetchVisitors);
    };
  }, []);

  const fetchOccupancy = async () => {
    try {
      const response = await accessService.getCurrentOccupancy();
      setOccupancy(response);
    } catch (err) {
      console.error('Error fetching occupancy:', err);
    }
  };

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const response = await accessService.getVisitors();
      
      let visitorsList: Visitor[] = [];
      if (Array.isArray(response)) {
        visitorsList = response.map(ensureVisitor);
      } else if (response?.results && Array.isArray(response.results)) {
        visitorsList = response.results.map(ensureVisitor);
      } else if (response && typeof response === 'object') {
        visitorsList = Object.values(response)
          .filter(val => typeof val === 'object' && val !== null && 'id' in val && 'first_name' in val && 'last_name' in val)
          .map(ensureVisitor);
      }
      
      setVisitors(visitorsList);
      const insideVisitors = visitorsList.filter(v => v.status === 'inside');
      setPeopleInside(insideVisitors);
      
      // Actualizar aforo
      fetchOccupancy();
    } catch (err) {
      console.error('Error fetching visitors:', err);
      setError('No se pudieron cargar los visitantes');
    } finally {
      setLoading(false);
    }
  };

  const handleAllowAccess = async (visitor: Visitor) => {
    try {
      if (occupancy && occupancy.total_count >= occupancy.max_capacity) {
        setError(`No se puede permitir el acceso. El edificio ha alcanzado su capacidad máxima (${occupancy.max_capacity} personas).`);
        return;
      }
      
      // Actualizar el visitante en el backend
      await accessService.updateVisitorStatus(visitor.id.toString(), 'inside');
      
      // Actualizar en el estado local
      const updatedVisitors = visitors.map(v => 
        v.id === visitor.id ? {...v, status: 'inside' as const} : v
      );
      setVisitors(updatedVisitors);
      
      const insideVisitors = updatedVisitors.filter(v => v.status === 'inside');
      setPeopleInside(insideVisitors);
      
      setSuccessMessage(`Acceso permitido a ${visitor.first_name} ${visitor.last_name}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Disparar evento para actualizar otras partes
      window.dispatchEvent(new Event('visitorStatusChanged'));
      fetchOccupancy();
    } catch (err) {
      console.error('Error allowing access:', err);
      setError('Error al permitir acceso');
    }
  };

  const handleDenyAccess = async (visitor: Visitor) => {
    try {
      // Actualizar el visitante en el backend
      await accessService.updateVisitorStatus(visitor.id.toString(), 'denied');
      
      // Actualizar en el estado local
      const updatedVisitors = visitors.map(v => 
        v.id === visitor.id ? {...v, status: 'denied' as const} : v
      );
      setVisitors(updatedVisitors);
      
      setSuccessMessage(`Acceso denegado a ${visitor.first_name} ${visitor.last_name}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Disparar evento para actualizar otras partes
      window.dispatchEvent(new Event('visitorStatusChanged'));
    } catch (err) {
      console.error('Error denying access:', err);
      setError('Error al denegar acceso');
    }
  };

  const handleExitBuilding = async (visitor: Visitor) => {
    try {
      // Actualizar el visitante en el backend
      await accessService.updateVisitorStatus(visitor.id.toString(), 'outside');
      
      // Actualizar en el estado local
      const updatedVisitors = visitors.map(v => 
        v.id === visitor.id ? {...v, status: 'outside' as const} : v
      );
      setVisitors(updatedVisitors);
      
      const insideVisitors = updatedVisitors.filter(v => v.status === 'inside');
      setPeopleInside(insideVisitors);
      
      setSuccessMessage(`Salida registrada para ${visitor.first_name} ${visitor.last_name}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Disparar evento para actualizar otras partes
      window.dispatchEvent(new Event('visitorStatusChanged'));
      fetchOccupancy();
    } catch (err) {
      console.error('Error registering exit:', err);
      setError('Error al registrar salida');
    }
  };

  // Función para eliminar visitante SIN modal
  const handleDeleteVisitor = async (visitor: Visitor) => {
    // No permitir eliminar si el visitante está dentro
    if (visitor.status && visitor.status === 'inside') {
      setError('No se puede eliminar un visitante que está dentro del edificio. Debe registrar su salida primero.');
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    try {
      setIsDeletingVisitor(true);
      console.log('Eliminando visitante ID:', visitor.id);
      
      // Eliminar visitante del backend
      await accessService.deleteVisitor(visitor.id.toString());
      console.log('Visitante eliminado exitosamente');
      
      // Actualizar en el estado local
      const updatedVisitors = visitors.filter(v => v.id !== visitor.id);
      setVisitors(updatedVisitors);
      
      const insideVisitors = updatedVisitors.filter(v => v.status === 'inside');
      setPeopleInside(insideVisitors);
      
      setSuccessMessage(`Visitante ${visitor.first_name} ${visitor.last_name} eliminado correctamente`);
      
      // Disparar evento para actualizar otras partes de la aplicación
      window.dispatchEvent(new Event('visitorDeleted'));
      
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Recargar la lista de visitantes después de eliminar
      fetchVisitors();
    } catch (err) {
      console.error('Error al eliminar visitante:', err);
      setError('Error al eliminar el visitante. Por favor, intente nuevamente.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsDeletingVisitor(false);
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

  useEffect(() => {
    const now = new Date();
    const timeExpiredVisitors = visitors.filter(visitor => 
      visitor.visitor_type === 'temporary' && 
      visitor.status === 'inside' && 
      visitor.exit_date && 
      new Date(visitor.exit_date) < now
    );
    
    if (timeExpiredVisitors.length > 0) {
      timeExpiredVisitors.forEach(visitor => {
        setError(prev => 
          prev ? 
          `${prev}\n🔔 Tiempo cumplido para ${visitor.first_name} ${visitor.last_name} - Reportar salida en el control de acceso` : 
          `🔔 Tiempo cumplido para ${visitor.first_name} ${visitor.last_name} - Reportar salida en el control de acceso`
        );
      });
    }
  }, [visitors]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Control de Acceso</h1>
          <div className="flex space-x-2">
            <Button 
              onClick={fetchVisitors}
              variant="outline"
              size="sm"
              className="border-gray-400 hover:bg-gray-100"
            >
              Actualizar
            </Button>
            <Link 
              href="/access/control/occupancy" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Control de Aforo
            </Link>
          </div>
        </div>

        {error && (
          <Alert variant="error">
            <AlertTitle>Error</AlertTitle>
            {error.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success">
            <AlertTitle>Éxito</AlertTitle>
            {successMessage}
          </Alert>
        )}

        {occupancy && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-300">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Control de Aforo</h3>
              <div className="mt-2 max-w-xl text-sm text-gray-600">
                <p>Personas dentro del edificio: {occupancy.total_count}/{occupancy.max_capacity}</p>
                <p className="text-xs text-gray-500 mt-1">Residentes: {occupancy.residents_count} | Visitantes: {occupancy.visitors_count}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-300">
          <div className="px-4 py-5 sm:px-6 bg-gray-100 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Visitantes Registrados</h2>
            <p className="mt-1 text-sm text-gray-600">
              Gestione el acceso de visitantes al edificio.
            </p>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loading size="lg" message="Cargando visitantes..." />
            </div>
          ) : visitors.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {visitors.map((visitor) => (
                <li key={visitor.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden bg-gray-200 border border-gray-300">
                        {visitor.photo ? (
                          <img 
                            src={visitor.photo}
                            alt={`${visitor.first_name} ${visitor.last_name}`}
                            className="h-12 w-12 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                parent.innerHTML = `<svg class="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>`;
                              }
                            }}
                          />
                        ) : (
                          <svg className="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-gray-900">{visitor.first_name} {visitor.last_name}</h3>
                          <span className="ml-2">{getStatusBadge(visitor.status)}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>{visitor.visitor_type || (visitor.company ? 'Empresa' : visitor.entry_date ? 'Temporal' : 'Normal')}</p>
                          {visitor.company && <p>Empresa: {visitor.company}</p>}
                          {visitor.apartment_number && <p>Apartamento: {visitor.apartment_number}</p>}
                          {visitor.phone && <p>Teléfono: {visitor.phone}</p>}
                          {visitor.entry_date && visitor.exit_date && (
                            <p>
                              Visita: {new Date(visitor.entry_date).toLocaleString()} - {new Date(visitor.exit_date).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {visitor.status === 'pending' && (
                        <>
                          <Button 
                            onClick={() => handleAllowAccess(visitor)}
                            variant="default"
                            size="sm"
                            className="bg-green-700 hover:bg-green-800"
                          >
                            ✅ Permitir
                          </Button>
                          <Button 
                            onClick={() => handleDenyAccess(visitor)}
                            variant="destructive"
                            size="sm"
                            className="bg-red-700 hover:bg-red-800"
                          >
                            ❌ Denegar
                          </Button>
                        </>
                      )}
                      
                      {visitor.status === 'inside' && (
                        <Button 
                          onClick={() => handleExitBuilding(visitor)}
                          variant="secondary"
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          🏃 Salió del edificio
                        </Button>
                      )}
                      
                      <Button 
                        onClick={() => handleDeleteVisitor(visitor)}
                        variant="outline"
                        size="sm"
                        className={visitor.status === 'inside' ? 
                          "border-gray-400 text-gray-500 cursor-not-allowed" :
                          "border-red-400 text-red-700 hover:bg-red-50"
                        }
                        disabled={isDeletingVisitor || visitor.status === 'inside'}
                      >
                        🗑️ Eliminar
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-gray-600">
              No hay visitantes registrados. Por favor, registre visitantes en la sección de Visitantes.
            </div>
          )}
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-300">
          <div className="px-4 py-5 sm:px-6 bg-gray-100 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Personas Actualmente Dentro</h2>
            <p className="mt-1 text-sm text-gray-600">
              Visitantes con acceso permitido que se encuentran dentro del edificio.
            </p>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loading size="lg" message="Cargando..." />
            </div>
          ) : peopleInside.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {peopleInside.map((visitor) => (
                <li key={visitor.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-200 border border-gray-300">
                        {visitor.photo ? (
                          <img 
                            src={visitor.photo}
                            alt={`${visitor.first_name} ${visitor.last_name}`}
                            className="h-10 w-10 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                parent.innerHTML = `<svg class="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>`;
                              }
                            }}
                          />
                        ) : (
                          <svg className="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">{visitor.first_name} {visitor.last_name}</h3>
                        <div className="text-sm text-gray-600">
                          <p>{visitor.visitor_type || (visitor.company ? 'Empresa' : visitor.entry_date ? 'Temporal' : 'Normal')}</p>
                          {visitor.apartment_number && <p>Apartamento: {visitor.apartment_number}</p>}
                          {visitor.entry_date && visitor.exit_date && (
                            <p>
                              Visita hasta: {new Date(visitor.exit_date).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleExitBuilding(visitor)}
                      variant="secondary"
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      🏃 Salió del edificio
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-gray-600">
              No hay personas dentro del edificio actualmente.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}