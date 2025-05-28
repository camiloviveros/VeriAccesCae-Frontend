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
  status?: 'pending' | 'approved' | 'inside' | 'outside' | 'denied';
  description?: string;
  created_by?: number;
  created_by_detail?: {
    id: number;
    username: string;
    full_name?: string;
  };
}

const parseVisitorStatus = (status?: string): 'pending' | 'approved' | 'inside' | 'outside' | 'denied' => {
  if (status === 'pending' || status === 'approved' || status === 'inside' || status === 'outside' || status === 'denied') {
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
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [peopleInside, setPeopleInside] = useState<Visitor[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchVisitors();
    
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
      
      if (error) setError('');
    } catch (err) {
      console.error('❌ Error cargando visitantes:', err);
      setError('No se pudieron cargar los visitantes. Verifique la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDescription = (id: number) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Función para eliminar visitante SIN confirmación
  const handleDeleteVisitor = async (visitor: Visitor) => {
    if (visitor.status === 'inside') {
      setError('No se puede eliminar un visitante que está dentro del edificio. Debe registrar su salida primero.');
      return;
    }

    const visitorName = `${visitor.first_name} ${visitor.last_name}`;
    const visitorId = visitor.id;
    
    if (processingIds.has(visitorId)) return;
    
    setProcessingIds(prev => new Set(prev).add(visitorId));
    setError('');
    
    try {
      console.log(`🗑️ Eliminando visitante ID ${visitorId}: ${visitorName}`);
      
      await accessService.deleteVisitor(visitorId.toString());
      console.log(`✅ Visitante ${visitorId} eliminado del backend exitosamente`);
      
      const updatedVisitors = visitors.filter(v => v.id !== visitorId);
      setVisitors(updatedVisitors);
      
      const updatedPeopleInside = updatedVisitors.filter(v => v.status === 'inside');
      setPeopleInside(updatedPeopleInside);
      
      setSuccessMessage(`✅ Visitante ${visitorName} eliminado correctamente`);
      
      window.dispatchEvent(new Event('visitorDeleted'));
      
      setTimeout(() => setSuccessMessage(''), 3000);
      
      console.log(`✅ Eliminación completada exitosamente: ${visitorName}`);
      
    } catch (error: any) {
      console.error('❌ Error durante la eliminación:', error);
      
      let errorMessage = 'Error al eliminar el visitante';
      
      if (error?.response?.status) {
        switch (error.response.status) {
          case 404:
            errorMessage = 'El visitante no fue encontrado. Es posible que ya haya sido eliminado.';
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
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(visitorId);
        return newSet;
      });
    }
  };

  // Función para permitir acceso - Para visitantes creados desde admin
  const handleAllowAccess = async (visitor: Visitor) => {
    if (!visitor || processingIds.has(visitor.id)) return;
    
    setProcessingIds(prev => new Set(prev).add(visitor.id));
    
    try {
      console.log(`✅ Permitiendo acceso a: ${visitor.first_name} ${visitor.last_name}`);
      
      // Cambiar estado a 'inside' para visitantes creados desde admin
      await accessService.updateVisitorStatus(visitor.id, 'inside');
      
      const updatedVisitors = visitors.map(v => 
        v.id === visitor.id ? {...v, status: 'inside' as const} : v
      );
      setVisitors(updatedVisitors);
      setPeopleInside(updatedVisitors.filter(v => v.status === 'inside'));
      
      setSuccessMessage(`✅ Acceso permitido a ${visitor.first_name} ${visitor.last_name}. El visitante está dentro del edificio.`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      window.dispatchEvent(new Event('visitorStatusChanged'));
    } catch (err) {
      console.error('❌ Error permitiendo acceso:', err);
      setError('Error al permitir acceso al visitante');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(visitor.id);
        return newSet;
      });
    }
  };

  // Función para aprobar solicitud - Para visitantes creados desde usuario
  const handleApproveRequest = async (visitor: Visitor) => {
    if (!visitor || processingIds.has(visitor.id)) return;
    
    setProcessingIds(prev => new Set(prev).add(visitor.id));
    
    try {
      console.log(`✅ Aprobando solicitud de: ${visitor.first_name} ${visitor.last_name}`);
      
      // Cambiar estado a 'approved' para visitantes creados desde usuario
      await accessService.updateVisitorStatus(visitor.id, 'approved');
      
      const updatedVisitors = visitors.map(v => 
        v.id === visitor.id ? {...v, status: 'approved' as const} : v
      );
      setVisitors(updatedVisitors);
      
      setSuccessMessage(`✅ Solicitud aprobada para ${visitor.first_name} ${visitor.last_name}. El usuario puede generar el código QR.`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      window.dispatchEvent(new Event('visitorStatusChanged'));
    } catch (err) {
      console.error('❌ Error aprobando solicitud:', err);
      setError('Error al aprobar la solicitud del visitante');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(visitor.id);
        return newSet;
      });
    }
  };

  // Función para denegar acceso
  const handleDenyAccess = async (visitor: Visitor) => {
    if (!visitor || processingIds.has(visitor.id)) return;
    
    setProcessingIds(prev => new Set(prev).add(visitor.id));
    
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
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(visitor.id);
        return newSet;
      });
    }
  };

  // Función para registrar salida
  const handleExitBuilding = async (visitor: Visitor) => {
    if (!visitor || processingIds.has(visitor.id)) return;
    
    setProcessingIds(prev => new Set(prev).add(visitor.id));
    
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
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(visitor.id);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status?: string) => {
    switch(status) {
      case 'inside':
        return <Badge variant="success" className="bg-green-500 text-white">Dentro</Badge>;
      case 'outside':
        return <Badge variant="secondary" className="bg-gray-500 text-white">Fuera</Badge>;
      case 'approved':
        return <Badge variant="info" className="bg-blue-500 text-white">Aprobado</Badge>;
      case 'denied':
        return <Badge variant="destructive" className="bg-red-500 text-white">Denegado</Badge>;
      default:
        return <Badge variant="warning" className="bg-yellow-500 text-white">Pendiente</Badge>;
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

  // Función para determinar si es un visitante creado por usuario
  const isUserCreatedVisitor = (visitor: Visitor): boolean => {
    return visitor.created_by !== null && visitor.created_by !== undefined;
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
            <h1 className="text-2xl font-semibold text-gray-900">Control de Acceso - Administración</h1>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={forceRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              {loading ? '🔄' : '🔄'} Actualizar
            </Button>
            <Link 
              href="/access/control/occupancy" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Control de Aforo
            </Link>
          </div>
        </div>

        {error && (
          <Alert variant="error" className="border-red-500 bg-red-50">
            <AlertTitle className="text-red-800">Error</AlertTitle>
            <div className="text-sm mt-1 text-red-700">{error}</div>
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" className="border-green-500 bg-green-50">
            <AlertTitle className="text-green-800">Éxito</AlertTitle>
            <div className="text-sm mt-1 text-green-700">{successMessage}</div>
          </Alert>
        )}

        {/* Resumen de aforo */}
        <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Estado del Aforo</h3>
            <div className="mt-2 flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">Visitantes dentro:</span> {peopleInside.length}
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-medium">Total visitantes:</span> {visitors.length}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de visitantes */}
        <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Gestión de Visitantes</h2>
            <p className="mt-1 text-sm text-gray-600">
              Apruebe, deniegue o controle el acceso de visitantes desde este panel.
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
                  <div className="space-y-2">
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
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-gray-900">
                              {visitor.first_name} {visitor.last_name}
                            </h3>
                            {getStatusBadge(visitor.status)}
                            {isUserCreatedVisitor(visitor) && (
                              <Badge className="bg-purple-500 text-white">Solicitud Usuario</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>
                              ID: {visitor.id} | 
                              Tipo: {visitor.visitor_type ? 
                                (visitor.visitor_type === 'temporary' ? 'Temporal' : 
                                 visitor.visitor_type === 'business' ? 'Empresarial' : 'Regular') 
                                : 'Regular'}
                            </p>
                            {visitor.company && <p>Empresa: {visitor.company}</p>}
                            {visitor.apartment_number && <p>Apartamento: {visitor.apartment_number}</p>}
                            {visitor.phone && <p>Teléfono: {visitor.phone}</p>}
                            {visitor.entry_date && visitor.exit_date && (
                              <p>Válido: {new Date(visitor.entry_date).toLocaleDateString()} - {new Date(visitor.exit_date).toLocaleDateString()}</p>
                            )}
                            {visitor.created_by_detail && (
                              <p className="text-purple-600">
                                Solicitado por: {visitor.created_by_detail.full_name || visitor.created_by_detail.username}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Botones para visitantes creados desde admin (sin created_by) */}
                        {!isUserCreatedVisitor(visitor) && visitor.status === 'pending' && (
                          <>
                            <Button 
                              onClick={() => handleAllowAccess(visitor)}
                              variant="default"
                              size="sm"
                              disabled={processingIds.has(visitor.id)}
                              className="bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400"
                              title={`Permitir acceso a ${visitor.first_name} ${visitor.last_name}`}
                            >
                              {processingIds.has(visitor.id) ? '⏳' : '✅'} Permitir
                            </Button>
                            <Button 
                              onClick={() => handleDenyAccess(visitor)}
                              variant="destructive"
                              size="sm"
                              disabled={processingIds.has(visitor.id)}
                              className="bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400"
                              title={`Denegar acceso a ${visitor.first_name} ${visitor.last_name}`}
                            >
                              {processingIds.has(visitor.id) ? '⏳' : '❌'} Denegar
                            </Button>
                          </>
                        )}
                        
                        {/* Botones para visitantes creados desde usuario (con created_by) */}
                        {isUserCreatedVisitor(visitor) && visitor.status === 'pending' && (
                          <>
                            <Button 
                              onClick={() => handleApproveRequest(visitor)}
                              variant="default"
                              size="sm"
                              disabled={processingIds.has(visitor.id)}
                              className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
                              title={`Aprobar solicitud de ${visitor.first_name} ${visitor.last_name}`}
                            >
                              {processingIds.has(visitor.id) ? '⏳' : '✅'} Aprobar Solicitud
                            </Button>
                            <Button 
                              onClick={() => handleDenyAccess(visitor)}
                              variant="destructive"
                              size="sm"
                              disabled={processingIds.has(visitor.id)}
                              className="bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400"
                              title={`Denegar solicitud de ${visitor.first_name} ${visitor.last_name}`}
                            >
                              {processingIds.has(visitor.id) ? '⏳' : '❌'} Denegar
                            </Button>
                          </>
                        )}
                        
                        {visitor.status === 'inside' && (
                          <Button 
                            onClick={() => handleExitBuilding(visitor)}
                            variant="secondary"
                            size="sm"
                            disabled={processingIds.has(visitor.id)}
                            className="bg-yellow-500 text-white hover:bg-yellow-600 disabled:bg-gray-400"
                            title={`Registrar salida de ${visitor.first_name} ${visitor.last_name}`}
                          >
                            {processingIds.has(visitor.id) ? '⏳' : '🏃'} Salió
                          </Button>
                        )}
                        
                        <Button 
                          onClick={() => handleDeleteVisitor(visitor)}
                          variant="outline"
                          size="sm"
                          className={visitor.status === 'inside' ? 
                            "border-gray-300 text-gray-400 cursor-not-allowed" :
                            "border-red-400 text-red-600 hover:bg-red-50 hover:border-red-500"
                          }
                          title={visitor.status === 'inside' ? 
                            "No se puede eliminar un visitante que está dentro del edificio" :
                            `Eliminar visitante ${visitor.first_name} ${visitor.last_name}`
                          }
                          disabled={processingIds.has(visitor.id) || visitor.status === 'inside'}
                        >
                          {processingIds.has(visitor.id) ? '⏳' : '🗑️'} Eliminar
                        </Button>
                      </div>
                    </div>
                    
                    {/* Mostrar descripción si existe */}
                    {visitor.description && (
                      <div className="mt-2">
                        <button
                          onClick={() => toggleDescription(visitor.id)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {expandedIds.has(visitor.id) ? '▼ Ocultar descripción' : '▶ Ver descripción'}
                        </button>
                        {expandedIds.has(visitor.id) && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{visitor.description}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2 text-gray-700">No hay visitantes registrados</p>
              <p className="text-sm text-gray-600">Los visitantes aparecerán aquí cuando sean registrados.</p>
            </div>
          )}
        </div>

        {/* Sección de personas dentro */}
        {peopleInside.length > 0 && (
          <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:px-6 bg-green-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-green-900">Visitantes Dentro del Edificio</h2>
              <p className="mt-1 text-sm text-green-700">
                Visitantes que actualmente están dentro del edificio.
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
                        <p className="text-sm text-gray-600">
                          {visitor.visitor_type ? 
                            (visitor.visitor_type === 'temporary' ? 'Temporal' : 
                             visitor.visitor_type === 'business' ? 'Empresarial' : 'Regular') 
                            : (visitor.company ? 'Empresa' : 'Normal')}
                          {visitor.apartment_number && ` - Apt. ${visitor.apartment_number}`}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleExitBuilding(visitor)}
                      variant="secondary"
                      size="sm"
                      disabled={processingIds.has(visitor.id)}
                      className="bg-yellow-500 text-white hover:bg-yellow-600 disabled:bg-gray-400"
                      title={`Registrar salida de ${visitor.first_name} ${visitor.last_name}`}
                    >
                      {processingIds.has(visitor.id) ? '⏳' : '🏃'} Registrar Salida
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Información sobre el proceso */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Diferencias entre visitantes</h4>
              <div className="text-sm text-blue-700 mt-1 space-y-1">
                <p><strong>Visitantes creados desde administración:</strong></p>
                <ul className="ml-4 list-disc">
                  <li>Botones: Permitir, Denegar, Eliminar</li>
                  <li>"Permitir" = El visitante entra directamente (estado: dentro)</li>
                  <li>No requieren código QR</li>
                </ul>
                <p className="mt-2"><strong>Solicitudes de usuarios (etiqueta morada):</strong></p>
                <ul className="ml-4 list-disc">
                  <li>Botones: Aprobar Solicitud, Denegar</li>
                  <li>"Aprobar Solicitud" = Autoriza al usuario a generar QR</li>
                  <li>El visitante no entra hasta escanear el QR</li>
                  <li>Pueden incluir descripción del motivo de visita</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}