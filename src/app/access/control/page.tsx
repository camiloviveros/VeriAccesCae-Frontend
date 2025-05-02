'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { accessService } from '../../../../lib/api';
import { Alert, AlertTitle } from '../../../../components/ui/Alert';
import { Button } from '../../../../components/ui/Button';
import { Loading } from '../../../../components/ui/Loading';
import { Modal } from '../../../../components/ui/Modal';
import { Badge } from '../../../../components/ui/Badge';
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

const parseVisitorStatus = (status?: string): 'pending' | 'inside' | 'outside' | 'denied' | undefined => {
  if (status === 'pending' || status === 'inside' || status === 'outside' || status === 'denied') {
    return status as 'pending' | 'inside' | 'outside' | 'denied';
  }
  return 'pending'; // Default value instead of undefined
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
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingVisitor, setIsDeletingVisitor] = useState(false);
  const [peopleInside, setPeopleInside] = useState<Visitor[]>([]);
  const [occupancyCount, setOccupancyCount] = useState(0);
  const maxOccupancy = 100;

  useEffect(() => {
    fetchVisitors();
    
    // Load occupancy counter from localStorage
    const storedCount = localStorage.getItem('occupancyCount');
    if (storedCount) {
      setOccupancyCount(parseInt(storedCount, 10));
    }
    
    // Set up timer to check for expiring temporary visitors
    const checkExpiringVisitors = () => {
      const now = new Date();
      // Find visitors whose exit time is within 15 minutes
      const expiringVisitors = visitors.filter(visitor => 
        visitor.visitor_type === 'temporary' && 
        visitor.status === 'inside' && 
        visitor.exit_date && 
        new Date(visitor.exit_date) > now &&
        new Date(visitor.exit_date).getTime() - now.getTime() < 15 * 60 * 1000 // 15 minutes
      );
      
      if (expiringVisitors.length > 0) {
        setError('Alerta: Hay visitantes temporales cuyo tiempo de visita está por expirar en los próximos 15 minutos.');
      }
    };
    
    const intervalId = setInterval(checkExpiringVisitors, 60000); // Check every minute
    
    return () => {
      clearInterval(intervalId);
    };
  }, [visitors]);

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
      
      // Check for expired visitors
      const now = new Date();
      const timeExpiredVisitors = visitorsList.filter(visitor => 
        visitor.visitor_type === 'temporary' && 
        visitor.status === 'inside' && 
        visitor.exit_date && 
        new Date(visitor.exit_date) < now
      );
      
      if (timeExpiredVisitors.length > 0) {
        const expiredNames = timeExpiredVisitors.map(v => `${v.first_name} ${v.last_name}`).join(', ');
        setError(`🔔 Tiempo cumplido para: ${expiredNames} - Reportar salida en el control de acceso`);
      }
    } catch (err) {
      console.error('Error fetching visitors:', err);
      setError('No se pudieron cargar los visitantes');
    } finally {
      setLoading(false);
    }
  };

  const handleAllowAccess = async (visitor: Visitor) => {
    try {
      if (occupancyCount >= maxOccupancy) {
        setError(`No se puede permitir el acceso. El edificio ha alcanzado su capacidad máxima (${maxOccupancy} personas).`);
        return;
      }
      
      // Update visitor in backend
      await accessService.updateVisitorStatus(visitor.id, 'inside');
      
      // Update in local state - use as const to ensure correct type
      const updatedVisitors = visitors.map(v => 
        v.id === visitor.id ? {...v, status: 'inside' as const} : v
      );
      setVisitors(updatedVisitors);
      
      const insideVisitors = updatedVisitors.filter(v => v.status === 'inside');
      setPeopleInside(insideVisitors);
      
      // If it's a temporary visitor, log entry time
      if (visitor.visitor_type === 'temporary') {
        const entryDate = new Date();
        // This would normally update entry_date in the backend, but we're just updating UI for now
        console.log(`Visitor ${visitor.id} entered at ${entryDate.toISOString()}`);
      }
      
      setSuccessMessage(`Acceso permitido a ${visitor.first_name} ${visitor.last_name}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error allowing access:', err);
      setError('Error al permitir acceso');
    }
  };

  const handleDenyAccess = async (visitor: Visitor) => {
    try {
      // Update visitor in backend
      await accessService.updateVisitorStatus(visitor.id, 'denied');
      
      // Update in local state - use as const to ensure correct type
      const updatedVisitors = visitors.map(v => 
        v.id === visitor.id ? {...v, status: 'denied' as const} : v
      );
      setVisitors(updatedVisitors);
      
      setSuccessMessage(`Acceso denegado a ${visitor.first_name} ${visitor.last_name}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error denying access:', err);
      setError('Error al denegar acceso');
    }
  };

  const handleExitBuilding = async (visitor: Visitor) => {
    try {
      // Update visitor in backend
      await accessService.updateVisitorStatus(visitor.id, 'outside');
      
      // Update in local state - use as const to ensure correct type
      const updatedVisitors = visitors.map(v => 
        v.id === visitor.id ? {...v, status: 'outside' as const} : v
      );
      setVisitors(updatedVisitors);
      
      const insideVisitors = updatedVisitors.filter(v => v.status === 'inside');
      setPeopleInside(insideVisitors);
      
      // If it's a temporary visitor, log exit time
      if (visitor.visitor_type === 'temporary') {
        const exitDate = new Date();
        // This would normally update exit_date in the backend, but we're just updating UI for now
        console.log(`Visitor ${visitor.id} exited at ${exitDate.toISOString()}`);
      }
      
      setSuccessMessage(`Salida registrada para ${visitor.first_name} ${visitor.last_name}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error registering exit:', err);
      setError('Error al registrar salida');
    }
  };

  const handleDeleteVisitor = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setShowDeleteModal(true);
  };

  const confirmDeleteVisitor = async () => {
    if (!selectedVisitor) return;
    
    try {
      setIsDeletingVisitor(true);
      
      // Delete visitor from backend
      await accessService.deleteVisitor(selectedVisitor.id);
      
      // Update in local state
      const updatedVisitors = visitors.filter(v => v.id !== selectedVisitor.id);
      setVisitors(updatedVisitors);
      
      // Update the list of people inside (only if visitor was inside)
      if (selectedVisitor.status === 'inside') {
        const insideVisitors = updatedVisitors.filter(v => v.status === 'inside');
        setPeopleInside(insideVisitors);
      }
      
      setSuccessMessage(`Visitante ${selectedVisitor.first_name} ${selectedVisitor.last_name} eliminado`);
      setShowDeleteModal(false);
      setSelectedVisitor(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting visitor:', err);
      setError('Error al eliminar visitante');
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

  const getRemainingTime = (exitDate?: string) => {
    if (!exitDate) return null;
    
    const exitTime = new Date(exitDate);
    const now = new Date();
    
    // If already expired
    if (exitTime < now) {
      return <span className="text-red-600 font-medium">Tiempo expirado</span>;
    }
    
    const diffMs = exitTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 15) {
      return <span className="text-red-600 font-medium">Menos de 15 minutos</span>;
    } else if (diffMins < 60) {
      return <span className="text-yellow-600">{diffMins} minutos</span>;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return <span>{hours}h {mins}m</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Control de Acceso</h1>
          <div className="flex space-x-2">
            <Button 
              onClick={() => fetchVisitors()}
              variant="outline"
              size="sm"
            >
              Actualizar
            </Button>
            <Link 
              href="/access/control/occupancy" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Control de Aforo</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Personas dentro del edificio: {peopleInside.length}/{maxOccupancy}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Visitantes Registrados</h2>
            <p className="mt-1 text-sm text-gray-500">
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
                <li key={visitor.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
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
                                parent.innerHTML = `<svg class="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>`;
                              }
                            }}
                          />
                        ) : (
                          <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-gray-900">{visitor.first_name} {visitor.last_name}</h3>
                          <span className="ml-2">{getStatusBadge(visitor.status)}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          <p>{visitor.visitor_type || (visitor.company ? 'Empresa' : visitor.entry_date ? 'Temporal' : 'Normal')}</p>
                          {visitor.company && <p>Empresa: {visitor.company}</p>}
                          {visitor.apartment_number && <p>Apartamento: {visitor.apartment_number}</p>}
                          {visitor.phone && <p>Teléfono: {visitor.phone}</p>}
                          {visitor.entry_date && visitor.exit_date && (
                            <div>
                              <p>
                                Visita: {new Date(visitor.entry_date).toLocaleString()} - {new Date(visitor.exit_date).toLocaleString()}
                              </p>
                              {visitor.status === 'inside' && (
                                <p className="text-xs mt-1">
                                  Tiempo restante: {getRemainingTime(visitor.exit_date)}
                                </p>
                              )}
                            </div>
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
                          >
                            ✅ Permitir
                          </Button>
                          <Button 
                            onClick={() => handleDenyAccess(visitor)}
                            variant="destructive"
                            size="sm"
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
                        >
                          🏃 Salió del edificio
                        </Button>
                      )}
                      
                      <Button 
                        onClick={() => handleDeleteVisitor(visitor)}
                        variant="outline"
                        size="sm"
                      >
                        🗑️ Eliminar
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-gray-500">
              No hay visitantes registrados. Por favor, registre visitantes en la sección de Visitantes.
            </div>
          )}
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Personas Actualmente Dentro</h2>
            <p className="mt-1 text-sm text-gray-500">
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
                <li key={visitor.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                        {visitor.photo ? (
                          <img 
                            src={visitor.photo}
                            alt={`${visitor.first_name} ${visitor.last_name}`}
                            className="h-10 w-10 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                parent.innerHTML = `<svg class="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>`;
                              }
                            }}
                          />
                        ) : (
                          <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">{visitor.first_name} {visitor.last_name}</h3>
                        <div className="text-sm text-gray-500">
                          <p>{visitor.visitor_type || (visitor.company ? 'Empresa' : visitor.entry_date ? 'Temporal' : 'Normal')}</p>
                          {visitor.apartment_number && <p>Apartamento: {visitor.apartment_number}</p>}
                          {visitor.entry_date && visitor.exit_date && (
                            <div>
                              <p>Visita hasta: {new Date(visitor.exit_date).toLocaleString()}</p>
                              <p className="text-xs mt-1">
                                Tiempo restante: {getRemainingTime(visitor.exit_date)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleExitBuilding(visitor)}
                      variant="secondary"
                      size="sm"
                    >
                      🏃 Salió del edificio
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-gray-500">
              No hay personas dentro del edificio actualmente.
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar eliminación"
        maxWidth="md"
      >
        <div className="py-4">
          <p className="text-sm text-gray-500">
            ¿Está seguro de que desea eliminar al visitante {selectedVisitor?.first_name} {selectedVisitor?.last_name}?
            Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeletingVisitor}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={confirmDeleteVisitor}
            isLoading={isDeletingVisitor}
            disabled={isDeletingVisitor}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}