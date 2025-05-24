'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { accessService } from '../../../../../../lib/api';
import { Button } from '../../../../../../components/ui/Button';
import { Alert, AlertTitle } from '../../../../../../components/ui/Alert';
import { Badge } from '../../../../../../components/ui/Badge';

interface Visitor {
  id: number;
  first_name: string;
  last_name: string;
  status?: string;
  visitor_type?: string;
  id_number?: string;
  phone?: string;
  apartment_number?: string;
  company?: string;
  entry_date?: string;
  exit_date?: string;
  created_at?: string;
}

export default function VisitorQRPage() {
  const params = useParams();
  const router = useRouter();
  const visitorId = params.id as string;

  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchVisitorAndQR();
  }, [router, visitorId]);

  const fetchVisitorAndQR = async () => {
    try {
      setLoading(true);
      
      // Fetch visitor information
      const visitorsResponse = await accessService.getVisitors();
      
      let visitors = [];
      if (Array.isArray(visitorsResponse)) {
        visitors = visitorsResponse;
      } else if (visitorsResponse?.results && Array.isArray(visitorsResponse.results)) {
        visitors = visitorsResponse.results;
      } else if (visitorsResponse && typeof visitorsResponse === 'object') {
        visitors = Object.values(visitorsResponse).filter(val => 
          typeof val === 'object' && val !== null && 'id' in val
        );
      }
      
      // Find specific visitor
      const foundVisitor = visitors.find(v => v.id.toString() === visitorId);
      
      if (!foundVisitor) {
        setError('Visitante no encontrado');
        setLoading(false);
        return;
      }
      
      setVisitor(foundVisitor);
      
      // Check if visitor has approved status
      if (foundVisitor.status === 'approved' || foundVisitor.status === 'inside' || foundVisitor.status === 'outside') {
        try {
          // Create visitor access to get QR
          const accessData = {
            visitor: foundVisitor.id,
            purpose: `Visita ${foundVisitor.visitor_type === 'temporary' ? 'temporal' : 
                              foundVisitor.visitor_type === 'business' ? 'empresarial' : 'regular'}`,
            valid_from: new Date().toISOString(),
            valid_to: foundVisitor.visitor_type === 'temporary' && foundVisitor.exit_date ? 
                      foundVisitor.exit_date : 
                      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Valid for 24 hours by default
            access_zones: [1] // Default access zone
          };
          
          // Try to create visitor access
          const accessResponse = await accessService.createVisitorAccess(accessData);
          
          if (accessResponse && accessResponse.id) {
            // Get QR image
            const qrResponse = await accessService.getQRCode(accessResponse.id);
            setQrImage(qrResponse.qr_code_image);
            setSuccess('Código QR generado exitosamente');
          }
        } catch (err: any) {
          console.error('Error fetching QR:', err);
          // If access already exists, try to get existing QR
          if (err.response?.status === 400 || err.response?.data?.detail?.includes('already exists')) {
            // Try to find existing access and get QR
            setError('El código QR ya fue generado anteriormente. Por favor, contacte al administrador.');
          } else {
            setError('Error al generar el código QR. Intente más tarde.');
          }
        }
      } else if (foundVisitor.status === 'pending') {
        setError('La visita aún no ha sido aprobada por administración. El código QR estará disponible una vez aprobada.');
      } else if (foundVisitor.status === 'denied') {
        setError('La visita ha sido denegada por administración. No se puede generar código QR.');
      }
    } catch (err) {
      console.error('Error fetching visitor data:', err);
      setError('No se pudo cargar la información de la visita');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch(status) {
      case 'inside':
        return <Badge className="bg-green-500 text-white text-sm px-3 py-1">✅ Dentro del edificio</Badge>;
      case 'outside':
        return <Badge className="bg-gray-600 text-white text-sm px-3 py-1">✅ Fuera del edificio</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500 text-white text-sm px-3 py-1">✅ Aprobado - QR Disponible</Badge>;
      case 'denied':
        return <Badge className="bg-red-500 text-white text-sm px-3 py-1">❌ Denegado</Badge>;
      default:
        return <Badge className="bg-yellow-500 text-white text-sm px-3 py-1">⏳ Pendiente de Aprobación</Badge>;
    }
  };

  const getVisitTypeName = (type?: string) => {
    switch(type) {
      case 'temporary':
        return 'Visita Temporal';
      case 'business':
        return 'Visita Empresarial';
      case 'regular':
        return 'Visita Normal';
      default:
        return 'Visita Normal';
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
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.push('/user/visits')}
              className="mr-4 text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver a Mis Visitas
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">
              Código QR de Acceso
            </h1>
          </div>
          
          {error && !qrImage && (
            <Alert variant="error" className="mb-6 border-red-500 bg-red-50">
              <AlertTitle className="text-red-800">⚠️ Estado de la Visita</AlertTitle>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" className="mb-6 border-green-500 bg-green-50">
              <AlertTitle className="text-green-800">✅ ¡QR Listo!</AlertTitle>
              <p className="text-green-700 text-sm mt-1">{success}</p>
            </Alert>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
                <p className="text-gray-600 mt-4">Verificando estado de la visita...</p>
              </div>
            </div>
          ) : visitor ? (
            <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg border border-gray-200">
              {/* Visitor info header */}
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-2xl">
                        {getVisitTypeIcon(visitor.visitor_type)}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-medium text-gray-900">
                        {visitor.first_name} {visitor.last_name}
                      </h2>
                      <div className="flex items-center space-x-3 mt-1">
                        <p className="text-sm text-gray-600">
                          {visitor.id_number && `ID: ${visitor.id_number}`}
                          {visitor.phone && ` • Tel: ${visitor.phone}`}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getVisitTypeName(visitor.visitor_type)}
                        </span>
                        {visitor.apartment_number && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Apt. {visitor.apartment_number}
                          </span>
                        )}
                        {visitor.company && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {visitor.company}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(visitor.status)}
                  </div>
                </div>
              </div>

              {qrImage ? (
                // Show QR Code
                <div className="px-4 py-8 sm:p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">
                      🎫 Su Código QR de Acceso
                    </h3>
                    <p className="text-lg text-gray-600">
                      Muestre este código QR al personal de seguridad para obtener acceso
                    </p>
                  </div>
                  
                  <div className="flex justify-center mb-8">
                    <div className="bg-white p-8 rounded-xl shadow-2xl border-4 border-blue-100">
                      <img 
                        src={qrImage} 
                        alt="Código QR de acceso" 
                        className="w-72 h-72 mx-auto"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-4 mb-8">
                    <Button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = qrImage;
                        link.download = `qr-visita-${visitor.first_name}-${visitor.last_name}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center px-6 py-3"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Descargar QR
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/user/visits/${visitor.id}`)}
                      className="border-blue-300 text-blue-600 hover:bg-blue-50 flex items-center px-6 py-3"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Ver Detalles de la Visita
                    </Button>
                  </div>
                  
                  {/* Instructions */}
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 max-w-2xl mx-auto mb-6">
                    <h4 className="text-lg font-medium text-blue-900 mb-3">
                      📋 Instrucciones de Uso
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-2">
                      <li className="flex items-start">
                        <span className="font-medium mr-2">1.</span>
                        Presente este código QR al personal de seguridad en el punto de acceso
                      </li>
                      <li className="flex items-start">
                        <span className="font-medium mr-2">2.</span>
                        Tenga a mano su documento de identidad para verificación
                      </li>
                      <li className="flex items-start">
                        <span className="font-medium mr-2">3.</span>
                        El código QR es único para esta visita y no puede ser transferido
                      </li>
                      {visitor.visitor_type === 'temporary' && (
                        <li className="flex items-start">
                          <span className="font-medium mr-2">4.</span>
                          Recuerde que esta es una visita temporal con fecha de expiración
                        </li>
                      )}
                      <li className="flex items-start">
                        <span className="font-medium mr-2">{visitor.visitor_type === 'temporary' ? '5.' : '4.'}</span>
                        Una vez utilizado, el visitante aparecerá como "dentro del edificio"
                      </li>
                    </ul>
                  </div>
                  
                  {/* Visit Summary */}
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 max-w-2xl mx-auto">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">
                      📄 Resumen de la Visita
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Visitante:</span>
                        <p className="text-gray-900">{visitor.first_name} {visitor.last_name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Documento:</span>
                        <p className="text-gray-900">{visitor.id_number || 'No proporcionado'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Tipo de Visita:</span>
                        <p className="text-gray-900">{getVisitTypeName(visitor.visitor_type)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Estado:</span>
                        <p className="text-green-600 font-medium">✅ Aprobado</p>
                      </div>
                      {visitor.apartment_number && (
                        <>
                          <div>
                            <span className="font-medium text-gray-700">Apartamento:</span>
                            <p className="text-gray-900">{visitor.apartment_number}</p>
                          </div>
                        </>
                      )}
                      {visitor.company && (
                        <>
                          <div>
                            <span className="font-medium text-gray-700">Empresa:</span>
                            <p className="text-gray-900">{visitor.company}</p>
                          </div>
                        </>
                      )}
                      {visitor.visitor_type === 'temporary' && visitor.entry_date && visitor.exit_date && (
                        <>
                          <div>
                            <span className="font-medium text-gray-700">Válido desde:</span>
                            <p className="text-gray-900">{new Date(visitor.entry_date).toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Válido hasta:</span>
                            <p className="text-gray-900">{new Date(visitor.exit_date).toLocaleString()}</p>
                          </div>
                        </>
                      )}
                      {visitor.created_at && (
                        <div className="sm:col-span-2">
                          <span className="font-medium text-gray-700">Fecha de solicitud:</span>
                          <p className="text-gray-900">{new Date(visitor.created_at).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Show waiting message
                <div className="px-4 py-8 sm:p-8">
                  <div className="text-center">
                    <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    
                    <h3 className="text-2xl font-medium text-gray-900 mb-4">
                      ⏳ Esperando Aprobación
                    </h3>
                    
                    <p className="text-center text-gray-600 mb-6 max-w-md mx-auto">
                      Su solicitud de visita está siendo revisada por el administrador. 
                      El código QR estará disponible una vez que la visita sea aprobada.
                    </p>
                    
                    <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 mb-6 max-w-lg mx-auto">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-yellow-800">Estado Actual</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Visita <strong>{visitor.status === 'denied' ? 'denegada' : 'pendiente de aprobación'}</strong> por parte del administrador del edificio.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        onClick={() => router.push('/user/visits')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver a Mis Visitas
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Verificar Estado
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow-lg p-8 rounded-lg text-center border border-gray-200">
              <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6M12 8v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Visita no encontrada
              </h3>
              <p className="text-gray-600 mb-6">
                No se pudo encontrar la información de esta visita.
              </p>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => router.push('/user/visits')}
              >
                Volver a Mis Visitas
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}