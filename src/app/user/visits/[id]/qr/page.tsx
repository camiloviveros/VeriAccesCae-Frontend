// src/app/user/visits/[id]/qr/page.tsx
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
}

interface VisitorAccess {
  id: number;
  visitor: number;
  purpose: string;
  valid_from: string;
  valid_to: string;
  qr_code: string;
  is_used: boolean;
}

export default function VisitorQRPage() {
  const params = useParams();
  const router = useRouter();
  const visitorId = params.id as string;

  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [visitorAccess, setVisitorAccess] = useState<VisitorAccess | null>(null);
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

    fetchVisitorAndAccess();
  }, [router, visitorId]);

  const fetchVisitorAndAccess = async () => {
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
      
      // Check if visitor has approved status (for showing QR)
      const isApproved = foundVisitor.status === 'inside';
      
      // Now try to get QR code - first need to get visitor access
      // This would ideally be a dedicated endpoint, but we'll simulate it
      try {
        // This is a placeholder - normally you would fetch the specific access for this visitor
        // In a real implementation, this would be a proper API endpoint
        
        // For this demo, let's generate a QR for the visitor
        if (isApproved) {
          // If the visitor is approved, we can show a QR code
          const qrResponse = await accessService.getQRCode(foundVisitor.id);
          setQrImage(qrResponse.qr_code_image);
          setSuccess('Código QR generado para la visita');
        } else {
          setError('La visita aún no ha sido aprobada por administración. El código QR estará disponible una vez aprobada.');
        }
      } catch (err) {
        console.error('Error fetching QR:', err);
        setError('No se encontró un código QR para esta visita. Es posible que aún no haya sido aprobada por administración.');
      }
    } catch (err) {
      console.error('Error fetching visitor data:', err);
      setError('No se pudo cargar la información de la visita');
    } finally {
      setLoading(false);
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
                <Link href="/user/create-qr" className="border-transparent text-white hover:border-white hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
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
              onClick={() => router.push(`/user/visits/${visitorId}`)}
              className="mr-4 text-blue-600 hover:text-blue-800"
            >
              &larr; Volver
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">
              Código QR para {visitor?.first_name} {visitor?.last_name}
            </h1>
          </div>
          
          {error && (
            <Alert variant="error" className="mb-6">
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" className="mb-6">
              <AlertTitle>{success}</AlertTitle>
            </Alert>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : visitor ? (
            <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg border border-gray-200">
              {qrImage ? (
                <div className="px-4 py-5 sm:p-6 flex flex-col items-center">
                  <div className="mb-4 text-lg font-semibold text-center">
                    Código QR para {visitor.first_name} {visitor.last_name}
                  </div>
                  <div className="text-sm text-center text-gray-500 mb-6">
                    Muestre este código QR al personal de seguridad para obtener acceso
                  </div>
                  <div className="border p-4 bg-white rounded-lg shadow-md">
                    <img 
                      src={qrImage} 
                      alt="Código QR de acceso" 
                      className="w-64 h-64"
                    />
                  </div>
                  <div className="mt-6 flex space-x-3">
                    <Button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = qrImage;
                        link.download = `qr-visitor-${visitor.id}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Descargar QR
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-5 sm:p-6 flex flex-col items-center">
                  <div className="rounded-full bg-yellow-100 p-4 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Código QR no disponible</h3>
                  <p className="text-sm text-center text-gray-500 mb-4 max-w-md">
                    El código QR estará disponible una vez que el administrador apruebe esta visita. Por favor, verifique más tarde.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-700">
                    <p>Estado actual: <Badge className="ml-2" variant={visitor.status === 'inside' ? 'success' : 'info'}>
                      {visitor.status === 'inside' ? 'Aprobado' : 'Pendiente'}
                    </Badge></p>
                  </div>
                  <Button
                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => router.push('/user/visits')}
                  >
                    Volver a la lista de visitas
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow-lg p-6 rounded-lg text-center border border-gray-200">
              <p className="text-gray-500">No se encontró información de la visita.</p>
              <Button
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => router.push('/user/visits')}
              >
                Volver a la lista de visitas
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}