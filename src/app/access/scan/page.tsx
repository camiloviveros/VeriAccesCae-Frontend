// src/app/access/scan/page.tsx
'use client';

import { useState } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { accessService } from '../../../../lib/api';
import { Button } from '../../../../components/ui/Button';
import { Alert, AlertTitle } from '../../../../components/ui/Alert';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';

export default function ScanQRPage() {
  const [qrValue, setQrValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [visitorInfo, setVisitorInfo] = useState<any | null>(null);
  
  // Simular lector de QR con un input de texto
  const handleQRInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQrValue(e.target.value);
  };
  
  const validateQR = async () => {
    if (!qrValue) {
      setError('Por favor, ingrese un código QR');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    setVisitorInfo(null);
    
    try {
      // En un escenario real, se enviaría el código QR escaneado
      // Por ahora simulamos con el ID del acceso
      const accessPointId = 1; // ID del punto de acceso actual (debería ser dinámico)
      
      const response = await accessService.validateQR({
        qr_code: qrValue,
        access_point_id: accessPointId
      });
      
      if (response.valid) {
        setSuccess('Acceso concedido');
        setVisitorInfo(response.visitor);
        
        // Actualizar contador de ocupación
        const storedCount = localStorage.getItem('occupancyCount');
        if (storedCount) {
          const count = parseInt(storedCount, 10);
          localStorage.setItem('occupancyCount', (count + 1).toString());
        } else {
          localStorage.setItem('occupancyCount', '1');
        }
        
        // Disparar evento para actualizar el dashboard
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('visitorStatusChanged'));
        }
      } else {
        setError(`Acceso denegado: ${response.reason}`);
      }
    } catch (err: any) {
      console.error('Error validating QR:', err);
      setError(err.message || 'Error al validar el código QR');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Escanear Código QR</h1>
        </div>
        
        {error && (
          <Alert variant="error">
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success">
            <AlertTitle>Éxito</AlertTitle>
            {success}
          </Alert>
        )}
        
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Ingrese o escanee el código QR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="qr_code" className="block text-sm font-medium text-gray-700">
                  Código QR
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="qr_code"
                    id="qr_code"
                    value={qrValue}
                    onChange={handleQRInput}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Ingrese el código QR"
                  />
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={validateQR}
                  isLoading={loading}
                  disabled={loading || !qrValue}
                  className="w-full sm:w-auto"
                >
                  Validar Acceso
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {visitorInfo && (
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Información del Visitante</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Acceso concedido</h3>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-b py-4">
                  <dl className="divide-y divide-gray-200">
                    <div className="py-3 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{visitorInfo.name}</dd>
                    </div>
                    {visitorInfo.company && (
                      <div className="py-3 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Empresa</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{visitorInfo.company}</dd>
                      </div>
                    )}
                    <div className="py-3 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Anfitrión</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{visitorInfo.host}</dd>
                    </div>
                    <div className="py-3 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Propósito</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{visitorInfo.purpose}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 px-4 py-4 sm:px-6">
              <div className="text-sm text-center w-full">
                <Badge variant="success" className="text-sm px-4 py-1">ENTRADA REGISTRADA</Badge>
              </div>
            </CardFooter>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}