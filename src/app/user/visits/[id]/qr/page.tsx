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
      
      // Check if visitor has approved status and try to get QR
      if (foundVisitor.status === 'inside' || foundVisitor.status === 'outside') {
        try {
          // Try to create visitor access first
          const accessData = {
            visitor: foundVisitor.id,
            purpose: 'Visita autorizada',
            valid_from: new Date().toISOString(),
            valid_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Valid for 24 hours
            access_zones: [1] // Default access zone
          };
          
          let accessResponse;
          try {
            accessResponse = await accessService.createVisitorAccess(accessData);
          } catch (accessError) {
            console.log('Access already exists or error creating access:', accessError);
            // If access creation fails, try to get QR directly
            const qrResponse = await accessService.getQRCode(foundVisitor.id);
            setQrImage(qrResponse.qr_code_image);
            setSuccess('Código QR disponible para la visita aprobada');
            return;
          }
          
          if (accessResponse && accessResponse.id) {
            // Get QR image
            const qrResponse = await accessService.getQRCode(accessResponse.id);
            setQrImage(qrResponse.qr_code_image);
            setSuccess('Código QR generado para la visita aprobada');
          }
        } catch (err) {
          console.error('Error fetching QR:', err);
          setError('Error al generar el código QR. Contacte al administrador.');
        }
      } else {
        setError('La visita aún no ha sido aprobada por administración. El código QR estará disponible una vez aprobada.');
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
        return <Badge variant="success" className="bg-green-500 text-white">Aprobado - Puede Ingresar</Badge>;
      case 'outside':
        return <Badge variant="secondary" className="bg-gray-500 text-white">Aprobado - Fuera</Badge>;
      case 'denied':
        return <Badge variant="destructive" className="bg-red-500 text-white">Denegado</Badge>;
      default:
        return <Badge variant="info" className="bg-yellow-500 text-white">Pendiente de Aprobación</Badge>;
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
                <Link href="/user/dashboard" className="border-transparent text-white hover:border-white hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/user/visits" className="border-white text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Mis Visitas
                </Link>
                <Link href="/user/create-visit" className="border-transparent text-white hover:border-white hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
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
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.push('/user/visits')}
              className="mr-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Volver a Mis Visitas
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">
              Código QR de Acceso
            </h1>
          </div>
          
          {error && (
            <Alert variant="error" className="mb-6 border-red-500 bg-red-50">
              <AlertTitle className="text-red-800">Error</AlertTitle>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" className="mb-6 border-green-500 bg-green-50">
              <AlertTitle className="text-green-800">Éxito</AlertTitle>
              <p className="text-green-700 text-sm mt-1">{success}</p>
            </Alert>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            </div>
          ) : visitor ? (
            <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg border border-gray-200">
              {/* Visitor info header */}
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xl font-medium">
                        {visitor.first_name.charAt(0)}{visitor.last_name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-xl font-medium text-gray-900">
                        {visitor.first_name} {visitor.last_name}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {visitor.id_number && `ID: ${visitor.id_number}`}
                        {visitor.phone && ` • Tel: ${visitor.phone}`}
                      </p>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getVisitTypeName(visitor.visitor_type)}
                        </span>
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
                <div className="px-4 py-8 sm:p-8 flex flex-col items-center">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      🎫 Código QR de Acceso
                    </h3>
                    <p className="text-gray-600">
                      Muestre este código QR al personal de seguridad para obtener acceso
                    </p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200">
                    <img 
                      src={qrImage} 
                      alt="Código QR de acceso" 
                      className="w-64 h-64 mx-auto"
                    />
                  </div>
                  
                  <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <Button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = qrImage;
                        link.download = `qr-visita-${visitor.first_name}-${visitor.last_name}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center"
                    >
                      📥 Descargar QR
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/user/visits/${visitor.id}`)}
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      👁️ Ver Detalles de la Visita
                    </Button>
                  </div>
                  
                  {/* Instructions */}
                  <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200 max-w-2xl">
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
                    </ul>
                  </div>
                </div>
              ) : (
                // Show waiting message
                <div className="px-4 py-8 sm:p-8 flex flex-col items-center">
                  <div className="rounded-full bg-yellow-100 p-6 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  
                  <h3 className="text-xl font-medium text-gray-900 mb-4">
                    ⏳ Esperando Aprobación
                  </h3>
                  
                  <p className="text-center text-gray-600 mb-6 max-w-md">
                    Su solicitud de visita está siendo revisada por el administrador. 
                    El código QR estará disponible una vez que la visita sea aprobada.
                  </p>
                  
                  <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 mb-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-800">Estado Actual</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Visita pendiente de aprobación por parte del administrador del edificio.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => router.push('/user/visits')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      ← Volver a Mis Visitas
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => window.location.reload()}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      🔄 Verificar Estado
                    </Button>
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