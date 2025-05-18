'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { accessService } from '../../../../lib/api';
import { Alert, AlertTitle } from '../../../../components/ui/Alert';
import { Button } from '../../../../components/ui/Button';
import { Loading } from '../../../../components/ui/Loading';
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

const parseVisitorStatus = (status?: string): 'pending' | 'inside' | 'outside' | 'denied' => {
  if (status === 'pending' || status === 'inside' || status === 'outside' || status === 'denied') {
    return status;
  }
  return 'pending';
};

const ensureVisitor = (visitor: any): Visitor => {
  const status = parseVisitorStatus(visitor.status);
  return {
    ...visitor,
    status
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
    
    const storedCount = localStorage.getItem('occupancyCount');
    if (storedCount) {
      setOccupancyCount(parseInt(storedCount, 10));
    }
    
    const handleVisitorChange = () => {
      console.log('Evento detectado, recargando visitantes...');
      fetchVisitors();
    };

    window.addEventListener('visitorStatusChanged', handleVisitorChange);
    window.addEventListener('visitorDeleted', handleVisitorChange);
    
    return () => {
      window.removeEventListener('visitorStatusChanged', handleVisitorChange);
      window.removeEventListener('visitorDeleted', handleVisitorChange);
    };
  }, []);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando visitantes...');
      const response = await accessService.getVisitors();
      
      let visitorsList: Visitor[] = [];
      if (Array.isArray(response)) {
        visitorsList = response.map(ensureVisitor);
      } else if (response?.results && Array.isArray(response.results)) {
        visitorsList = response.results.map(ensureVisitor);
      } else if (response && typeof response === 'object') {
        visitorsList = Object.values(response)
          .filter(val => 
            typeof val === 'object' && val !== null && 'id' in val && 'first_name' in val && 'last_name' in val
          )
          .map(ensureVisitor);
      }
      
      console.log(`✅ ${visitorsList.length} visitantes cargados`);
      setVisitors(visitorsList);
      const insideVisitors = visitorsList.filter(v => v.status === 'inside');
      setPeopleInside(insideVisitors);
      
      // Limpiar errores al cargar exitosamente
      if (error) setError('');
    } catch (err) {
      console.error('❌ Error cargando visitantes:', err);
      setError('No se pudieron cargar los visitantes. Verifique la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar visitante
  const handleDeleteVisitor = (visitor: Visitor) => {
    console.log('🗑️ Preparando eliminación:', visitor);
    setSelectedVisitor(visitor);
    setShowDeleteModal(true);
    setError('');
    setIsDeletingVisitor(false);
  };

  // Función de eliminación principal
  const confirmDeleteVisitor = async () => {
    if (!selectedVisitor || isDeletingVisitor) {
      console.log('❌ No se puede eliminar - Visitante no seleccionado o ya eliminando');
      return;
    }
    
    const visitorName = `${selectedVisitor.first_name} ${selectedVisitor.last_name}`;
    const visitorId = selectedVisitor.id;
    
    console.log(`🔄 Iniciando eliminación de visitante ID ${visitorId}: ${visitorName}`);
    
    try {
      setIsDeletingVisitor(true);
      setError('');
      
      // Eliminar visitante del backend
      console.log(`🔄 Eliminando del backend...`);
      await accessService.deleteVisitor(visitorId.toString());
      console.log(`✅ Visitante ${visitorId} eliminado del backend exitosamente`);
      
      // Actualizar estado local inmediatamente
      const updatedVisitors = visitors.filter(v => v.id !== visitorId);
      setVisitors(updatedVisitors);
      
      // Actualizar visitantes dentro si el visitante estaba dentro
      const updatedPeopleInside = updatedVisitors.filter(v => v.status === 'inside');
      setPeopleInside(updatedPeopleInside);
      
      // Actualizar contador de aforo si es necesario
      if (selectedVisitor.status === 'inside') {
        const newCount = Math.max(0, occupancyCount - 1);
        setOccupancyCount(newCount);
        localStorage.setItem('occupancyCount', newCount.toString());
        console.log(`📊 Aforo actualizado: ${newCount}`);
      }
      
      // Cerrar modal y limpiar estado
      setShowDeleteModal(false);
      setSelectedVisitor(null);
      
      // Mostrar mensaje de éxito
      setSuccessMessage(`✅ Visitante ${visitorName} eliminado correctamente`);
      
      // Notificar otros componentes
      window.dispatchEvent(new Event('visitorDeleted'));
      
      // Refrescar datos desde el servidor para asegurar sincronización
      setTimeout(() => {
        fetchVisitors();
      }, 500);
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
      
      console.log(`✅ Eliminación completada exitosamente: ${visitorName}`);
      
    } catch (error: any) {
      console.error('❌ Error durante la eliminación:', error);
      
      let errorMessage = 'Error al eliminar el visitante';
      
      if (error?.response?.status) {
        switch (error.response.status) {
          case 404:
            errorMessage = 'El visitante no fue encontrado. Es posible que ya haya sido eliminado.';
            // Si es 404, actualizar la lista ya que el visitante no existe
            fetchVisitors();
            break;
          case 403:
            errorMessage = 'No tiene permisos para eliminar este visitante.';
            break;
          case 500:
            errorMessage = 'Error del servidor. Intente nuevamente.';
            break;
          default:
            errorMessage = error.response?.data?.detail || 'Error al comunicarse con el servidor.';
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
    } finally {
      setIsDeletingVisitor(false);
    }
  };

  // Función para cancelar eliminación
  const cancelDelete = () => {
    if (!isDeletingVisitor) {
      setShowDeleteModal(false);
      setSelectedVisitor(null);
      setError('');
    }
  };

  // Función para permitir acceso
  const handleAllowAccess = async (visitor: Visitor) => {
    if (!visitor) return;
    
    try {
      console.log(`✅ Permitiendo acceso a: ${visitor.first_name} ${visitor.last_name}`);
      await accessService.updateVisitorStatus(visitor.id, 'inside');
      
      const updatedVisitors = visitors.map(v => 
        v.id === visitor.id ? {...v, status: 'inside' as const} : v
      );
      setVisitors(updatedVisitors);
      
      const insideVisitors = updatedVisitors.filter(v => v.status === 'inside');
      setPeopleInside(insideVisitors);
      
      setSuccessMessage(`✅ Acceso permitido a ${visitor.first_name} ${visitor.last_name}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      window.dispatchEvent(new Event('visitorStatusChanged'));
    } catch (err) {
      console.error('❌ Error permitiendo acceso:', err);
      setError('Error al permitir acceso al visitante');
    }
  };

  // Función para denegar acceso
  const handleDenyAccess = async (visitor: Visitor) => {
    if (!visitor) return;
    
    try {
      console.log(`❌ Denegando acceso a: ${visitor.first_name} ${visitor.last_name}`);
      await accessService.updateVisitorStatus(visitor.id, 'denied');
      
      const updatedVisitors = visitors.map(v => 
        v.id === visitor.id ? {...v, status: 'denied' as const} : v
      );
      setVisitors(updatedVisitors);
      
      setSuccessMessage(`❌ Acceso denegado a ${visitor.first_name} ${visitor.last_name}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      window.dispatchEvent(new Event('visitorStatusChanged'));
    } catch (err) {
      console.error('❌ Error denegando acceso:', err);
      setError('Error al denegar acceso al visitante');
    }
  };

  // Función para registrar salida
  const handleExitBuilding = async (visitor: Visitor) => {
    if (!visitor) return;
    
    try {
      console.log(`🏃 Registrando salida de: ${visitor.first_name} ${visitor.last_name}`);
      await accessService.updateVisitorStatus(visitor.id, 'outside');
      
      const updatedVisitors = visitors.map(v => 
        v.id === visitor.id ? {...v, status: 'outside' as const} : v
      );
      setVisitors(updatedVisitors);
      
      const insideVisitors = updatedVisitors.filter(v => v.status === 'inside');
      setPeopleInside(insideVisitors);
      
      setSuccessMessage(`🏃 Salida registrada para ${visitor.first_name} ${visitor.last_name}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      window.dispatchEvent(new Event('visitorStatusChanged'));
    } catch (err) {
      console.error('❌ Error registrando salida:', err);
      setError('Error al registrar la salida del visitante');
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

  // Función para forzar recarga manual
  const forceRefresh = async () => {
    setError('');
    setSuccessMessage('');
    await fetchVisitors();
    setSuccessMessage('✅ Lista actualizada');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Control de Acceso - Administración</h1>
          <div className="flex space-x-2">
            <Button 
              onClick={forceRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              {loading ? '🔄' : '🔄'} Actualizar
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
            <div className="text-sm mt-1">{error}</div>
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success">
            <AlertTitle>Éxito</AlertTitle>
            <div className="text-sm mt-1">{successMessage}</div>
          </Alert>
        )}

        {/* Resumen de aforo */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Estado del Aforo</h3>
            <div className="mt-2 flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                <span className="font-medium">Visitantes dentro:</span> {peopleInside.length}
              </div>
              <div className="text-sm text-gray-500">
                <span className="font-medium">Capacidad máxima:</span> {maxOccupancy}
              </div>
              <div className="text-sm text-gray-500">
                <span className="font-medium">Total visitantes:</span> {visitors.length}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de visitantes */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Gestión de Visitantes</h2>
            <p className="mt-1 text-sm text-gray-500">
              Apruebe, deniegue o elimine visitantes desde este panel de control.
            </p>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loading size="lg" message="Cargando visitantes..." />
            </div>
          ) : visitors.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {visitors.map((visitor) => (
                <li key={`visitor-${visitor.id}`} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
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
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {visitor.first_name} {visitor.last_name}
                          </h3>
                          {getStatusBadge(visitor.status)}
                        </div>
                        <div className="text-sm text-gray-500">
                          <p>ID: {visitor.id} | Tipo: {visitor.visitor_type || 'Normal'}</p>
                          {visitor.company && <p>Empresa: {visitor.company}</p>}
                          {visitor.apartment_number && <p>Apartamento: {visitor.apartment_number}</p>}
                          {visitor.phone && <p>Teléfono: {visitor.phone}</p>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {visitor.status === 'pending' && (
                        <>
                          <Button 
                            onClick={() => handleAllowAccess(visitor)}
                            variant="default"
                            size="sm"
                            title={`Permitir acceso a ${visitor.first_name} ${visitor.last_name}`}
                          >
                            ✅ Permitir
                          </Button>
                          <Button 
                            onClick={() => handleDenyAccess(visitor)}
                            variant="destructive"
                            size="sm"
                            title={`Denegar acceso a ${visitor.first_name} ${visitor.last_name}`}
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
                          title={`Registrar salida de ${visitor.first_name} ${visitor.last_name}`}
                        >
                          🏃 Salió
                        </Button>
                      )}
                      
                      <Button 
                        onClick={() => handleDeleteVisitor(visitor)}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                        title={`Eliminar visitante ${visitor.first_name} ${visitor.last_name}`}
                        disabled={isDeletingVisitor}
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
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">No hay visitantes registrados</p>
              <p className="text-sm">Los visitantes aparecerán aquí cuando sean registrados por los usuarios.</p>
              <div className="mt-4">
                <Link href="/access/visitors/new">
                  <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                    Registrar Visitante Manualmente
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Sección de personas dentro */}
        {peopleInside.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Visitantes Dentro del Edificio</h2>
              <p className="mt-1 text-sm text-gray-500">
                Visitantes que actualmente tienen acceso y están dentro del edificio.
              </p>
            </div>
            
            <ul className="divide-y divide-gray-200">
              {peopleInside.map((visitor) => (
                <li key={`inside-${visitor.id}`} className="px-4 py-4 sm:px-6 hover:bg-green-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-green-100">
                        {visitor.photo ? (
                          <img 
                            src={visitor.photo}
                            alt={`${visitor.first_name} ${visitor.last_name}`}
                            className="h-10 w-10 object-cover"
                          />
                        ) : (
                          <svg className="h-full w-full text-green-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">
                          {visitor.first_name} {visitor.last_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {visitor.visitor_type || (visitor.company ? 'Empresa' : 'Normal')}
                          {visitor.apartment_number && ` - Apt. ${visitor.apartment_number}`}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleExitBuilding(visitor)}
                      variant="secondary"
                      size="sm"
                      title={`Registrar salida de ${visitor.first_name} ${visitor.last_name}`}
                    >
                      🏃 Registrar Salida
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación - COMPLETAMENTE PERSONALIZADO */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Overlay fijo - semi-transparente */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 transition-opacity duration-200"
            onClick={!isDeletingVisitor ? cancelDelete : undefined}
          />
          
          {/* Contenedor modal centrado */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-200 scale-100">
              {/* Header del modal */}
              <div className="bg-red-50 px-6 py-4 border-b border-red-100 rounded-t-xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Eliminar Visitante
                    </h3>
                    <p className="text-sm text-red-600">
                      Esta acción no se puede deshacer
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenido del modal */}
              <div className="px-6 py-4">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    ¿Está completamente seguro de que desea eliminar al visitante?
                  </p>
                  
                  {/* Info del visitante */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-lg">
                          {selectedVisitor?.first_name?.charAt(0)}{selectedVisitor?.last_name?.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="font-semibold text-gray-900">
                          {selectedVisitor?.first_name} {selectedVisitor?.last_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          ID: {selectedVisitor?.id} • Estado: {selectedVisitor?.status || 'Pendiente'}
                        </p>
                        {selectedVisitor?.visitor_type && (
                          <p className="text-sm text-gray-600">
                            Tipo: {selectedVisitor.visitor_type}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advertencia sobre visitante dentro */}
                {selectedVisitor?.status === 'inside' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Nota:</span> Este visitante está actualmente dentro del edificio. 
                          Su eliminación actualizará automáticamente el contador de aforo.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Advertencia general */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Se eliminarán permanentemente todos los registros asociados con este visitante.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer con botones */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
                  <button
                    type="button"
                    onClick={cancelDelete}
                    disabled={isDeletingVisitor}
                    className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteVisitor}
                    disabled={isDeletingVisitor}
                    className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDeletingVisitor ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Eliminando...
                      </>
                    ) : (
                      'Eliminar Permanentemente'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}