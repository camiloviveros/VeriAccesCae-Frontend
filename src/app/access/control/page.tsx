// src/app/access/control/page.tsx - Modal de eliminación corregido
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
    setError(''); // Limpiar errores previos
  };

  // Función de eliminación principal
  const confirmDeleteVisitor = async () => {
    if (!selectedVisitor) {
      console.error('❌ No hay visitante seleccionado');
      setError('Error: No hay visitante seleccionado para eliminar');
      return;
    }
    
    const visitorName = `${selectedVisitor.first_name} ${selectedVisitor.last_name}`;
    const visitorId = selectedVisitor.id;
    
    try {
      setIsDeletingVisitor(true);
      setError('');
      console.log(`🔄 Eliminando visitante ID ${visitorId}: ${visitorName}`);
      
      // Intentar eliminar del backend
      try {
        await accessService.deleteVisitor(visitorId);
        console.log(`✅ Visitante ${visitorId} eliminado del backend`);
      } catch (apiError: any) {
        console.error('❌ Error en API de eliminación:', apiError);
        
        // Si es 404, el visitante ya no existe en el backend
        if (apiError?.response?.status === 404) {
          console.log('ℹ️ Visitante no encontrado en backend, eliminando solo localmente');
        } else {
          throw apiError;
        }
      }
      
      // Actualizar estado local
      console.log('🔄 Actualizando estado local...');
      const updatedVisitors = visitors.filter(v => v.id !== visitorId);
      setVisitors(updatedVisitors);
      
      // Actualizar visitantes dentro si es necesario
      if (selectedVisitor.status === 'inside') {
        const updatedPeopleInside = updatedVisitors.filter(v => v.status === 'inside');
        setPeopleInside(updatedPeopleInside);
        
        // Actualizar contador de aforo
        const newCount = Math.max(0, occupancyCount - 1);
        setOccupancyCount(newCount);
        localStorage.setItem('occupancyCount', newCount.toString());
        console.log(`📊 Aforo actualizado: ${newCount}`);
      }
      
      // Mostrar éxito y limpiar
      setSuccessMessage(`✅ Visitante ${visitorName} eliminado correctamente`);
      setShowDeleteModal(false);
      setSelectedVisitor(null);
      
      // Notificar otros componentes
      window.dispatchEvent(new Event('visitorDeleted'));
      console.log(`✅ Eliminación completada: ${visitorName}`);
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error: any) {
      console.error('❌ Error completo en eliminación:', error);
      
      let errorMessage = 'Error inesperado al eliminar el visitante';
      
      if (error?.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 400:
            errorMessage = 'Solicitud inválida. Verifique los datos del visitante.';
            break;
          case 401:
            errorMessage = 'No autorizado. Por favor, inicie sesión nuevamente.';
            break;
          case 403:
            errorMessage = 'No tiene permisos para eliminar este visitante.';
            break;
          case 404:
            errorMessage = 'Visitante no encontrado en el servidor.';
            break;
          case 500:
            errorMessage = 'Error del servidor. Contacte al administrador del sistema.';
            break;
          default:
            if (data && typeof data === 'string') {
              errorMessage = data;
            } else if (data && data.detail) {
              errorMessage = data.detail;
            } else {
              errorMessage = `Error del servidor (${status}). Contacte al administrador.`;
            }
        }
      } else if (error?.message) {
        errorMessage = `Error de conexión: ${error.message}`;
      }
      
      setError(`❌ ${errorMessage}`);
    } finally {
      setIsDeletingVisitor(false);
    }
  };

  // Función para cancelar eliminación
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedVisitor(null);
    setError('');
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

      {/* Modal de confirmación de eliminación CORREGIDO */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          {/* Overlay con backdrop */}
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay oscuro */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={!isDeletingVisitor ? cancelDelete : undefined}
            ></div>

            {/* Centrado vertical */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal */}
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Eliminar Visitante
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Está seguro de que desea eliminar al visitante{' '}
                        <span className="font-semibold text-gray-900">
                          {selectedVisitor?.first_name} {selectedVisitor?.last_name}
                        </span>?
                      </p>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4 mt-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            <strong>Atención:</strong> Esta acción eliminará permanentemente todos los registros asociados con este visitante.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {selectedVisitor?.status === 'inside' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                        <p className="text-sm text-blue-700">
                          ℹ️ <strong>Visitante dentro del edificio:</strong> También se actualizará el contador de aforo.
                        </p>
                      </div>
                    )}
                    
                    {selectedVisitor && (
                      <div className="bg-gray-50 rounded-md p-3 mb-4">
                        <div className="text-sm text-gray-600">
                          <p><strong>ID:</strong> {selectedVisitor.id}</p>
                          <p><strong>Estado:</strong> {selectedVisitor.status}</p>
                          {selectedVisitor.visitor_type && <p><strong>Tipo:</strong> {selectedVisitor.visitor_type}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={confirmDeleteVisitor}
                  isLoading={isDeletingVisitor}
                  disabled={isDeletingVisitor}
                  className="w-full sm:w-auto sm:ml-3"
                >
                  {isDeletingVisitor ? 'Eliminando...' : 'Sí, Eliminar Permanentemente'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancelDelete}
                  disabled={isDeletingVisitor}
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}