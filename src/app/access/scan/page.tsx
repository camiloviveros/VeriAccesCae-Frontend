// src/app/access/scan/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { accessService } from '../../../../lib/api';
import { Button } from '../../../../components/ui/Button';
import { Alert, AlertTitle } from '../../../../components/ui/Alert';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import jsQR from 'jsqr';

interface VisitorInfo {
  id: number;
  name: string;
  company?: string;
  host?: string;
  purpose?: string;
  visitor_type?: string;
  apartment_number?: string;
}

export default function ScanQRPage() {
  const router = useRouter();
  const [qrValue, setQrValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scannerSupported, setScannerSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Verificar soporte para getUserMedia
  useEffect(() => {
    setScannerSupported(
      typeof navigator !== 'undefined' && 
      typeof navigator.mediaDevices !== 'undefined' && 
      typeof navigator.mediaDevices.getUserMedia !== 'undefined'
    );
  }, []);

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Función para iniciar la cámara
  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        startScanning();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara. Verifique los permisos.');
    }
  };

  // Función para detener la cámara
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraActive(false);
    stopScanning();
  };

  // Función para iniciar el escaneo continuo
  const startScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = setInterval(async () => {
      if (videoRef.current && canvasRef.current && cameraActive) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');

        if (context && video.readyState === 4) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          try {
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });
            
            if (code) {
              console.log('QR Code detected:', code.data);
              setQrValue(code.data);
              await validateQR(code.data);
              stopCamera();
            }
          } catch (error) {
            // Continue scanning
          }
        }
      }
    }, 100);
  };

  // Función para detener el escaneo
  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const handleQRInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQrValue(e.target.value);
  };
  
  const validateQR = async (qrCode?: string) => {
    const codeToValidate = qrCode || qrValue;
    
    if (!codeToValidate) {
      setError('Por favor, ingrese un código QR o escanee uno con la cámara');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    setVisitorInfo(null);
    
    try {
      const accessPointId = 1; // ID del punto de acceso actual
      
      const response = await accessService.validateQR({
        qr_code: codeToValidate,
        access_point_id: accessPointId
      });
      
      if (response.valid) {
        setSuccess('✅ Acceso concedido - Visitante autorizado');
        setVisitorInfo(response.visitor);
        
        // Actualizar los contadores y estados en tiempo real
        window.dispatchEvent(new Event('visitorStatusChanged'));
        
        // Reproducir sonido de éxito
        const audio = new Audio('/sounds/success.mp3');
        audio.play().catch(() => {});
        
        // Limpiar después de 5 segundos
        setTimeout(() => {
          setQrValue('');
          setVisitorInfo(null);
          setSuccess('');
        }, 5000);
        
      } else {
        setError(`❌ Acceso denegado: ${response.reason}`);
        
        // Reproducir sonido de error
        const audio = new Audio('/sounds/error.mp3');
        audio.play().catch(() => {});
        
        setTimeout(() => {
          setQrValue('');
          setError('');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error validating QR:', err);
      let errorMessage = 'Error al validar el código QR';
      
      if (err.response?.status === 404) {
        errorMessage = 'Código QR no válido o no encontrado';
      } else if (err.response?.status === 403) {
        errorMessage = 'Acceso no autorizado';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      setTimeout(() => {
        setQrValue('');
        setError('');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleManualValidation = () => {
    validateQR();
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => router.push('/access/control')}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-300"
            >
              ← Volver al Control de Acceso
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">Escanear Código QR</h1>
          </div>
        </div>
        
        {error && (
          <Alert variant="error" className="border-red-300 bg-red-50">
            <AlertTitle className="text-red-800">Error</AlertTitle>
            <p className="text-red-700">{error}</p>
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="border-green-300 bg-green-50">
            <AlertTitle className="text-green-800">Éxito</AlertTitle>
            <p className="text-green-700">{success}</p>
          </Alert>
        )}
        
        {/* Scanner de Cámara */}
        <Card className="bg-white border-gray-200 shadow-lg">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <span>📷</span>
              <span>Scanner de Cámara</span>
              {cameraActive && (
                <Badge className="bg-green-500 text-white border-green-600">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>Escaneando</span>
                  </div>
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {scannerSupported ? (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    className={`w-full max-w-md mx-auto rounded-lg border-2 ${
                      cameraActive ? 'border-green-500' : 'border-gray-300'
                    }`}
                    style={{ display: cameraActive ? 'block' : 'none' }}
                    playsInline
                    muted
                  />
                  
                  <canvas
                    ref={canvasRef}
                    style={{ display: 'none' }}
                  />
                  
                  {!cameraActive && (
                    <div className="w-full max-w-md mx-auto h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">Activar cámara para escanear</p>
                      </div>
                    </div>
                  )}
                  
                  {cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-4 border-green-500 rounded-lg shadow-lg bg-transparent">
                        <div className="w-full h-full border-2 border-dashed border-green-300 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 text-sm font-medium bg-white px-2 py-1 rounded shadow">
                            Apunte al código QR
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-center space-x-4">
                  {!cameraActive ? (
                    <Button
                      onClick={startCamera}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 shadow"
                      disabled={loading}
                    >
                      📷 Activar Cámara
                    </Button>
                  ) : (
                    <Button
                      onClick={stopCamera}
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 shadow"
                      disabled={loading}
                    >
                      ⏹️ Detener Cámara
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">La cámara no está disponible en este dispositivo</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Input Manual */}
        <Card className="bg-white border-gray-200 shadow-lg">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className="text-gray-800">⌨️ Ingreso Manual de Código QR</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="qr_code" className="block text-sm font-medium text-gray-700 mb-1">
                  Código QR
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="qr_code"
                    id="qr_code"
                    value={qrValue}
                    onChange={handleQRInput}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Pegue o escriba el código QR aquí"
                  />
                  <Button
                    onClick={handleManualValidation}
                    disabled={loading || !qrValue}
                    className="inline-flex items-center px-4 py-2 rounded-r-md border border-l-0 border-gray-300 bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {loading ? '⏳' : '🔍'} Validar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Información del Visitante */}
        {visitorInfo && (
          <Card className="bg-white border-green-300 shadow-lg">
            <CardHeader className="bg-green-50 border-b border-green-200">
              <CardTitle className="text-green-800">✅ Información del Visitante Autorizado</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-green-100 p-4 rounded-md border border-green-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Acceso Concedido</h3>
                      <p className="text-sm text-green-700 mt-1">El visitante ha sido autorizado a ingresar al edificio</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-b border-gray-200 py-4">
                  <dl className="divide-y divide-gray-200">
                    <div className="py-3 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-600">Nombre</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{visitorInfo.name}</dd>
                    </div>
                    {visitorInfo.company && (
                      <div className="py-3 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-600">Empresa</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{visitorInfo.company}</dd>
                      </div>
                    )}
                    {visitorInfo.apartment_number && (
                      <div className="py-3 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-600">Apartamento</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{visitorInfo.apartment_number}</dd>
                      </div>
                    )}
                    {visitorInfo.host && (
                      <div className="py-3 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-600">Anfitrión</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{visitorInfo.host}</dd>
                      </div>
                    )}
                    {visitorInfo.purpose && (
                      <div className="py-3 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-600">Propósito</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{visitorInfo.purpose}</dd>
                      </div>
                    )}
                    <div className="py-3 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-600">Hora de acceso</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{new Date().toLocaleString()}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-green-50 px-4 py-4 sm:px-6 border-t border-green-200">
              <div className="text-sm text-center w-full">
                <Badge variant="success" className="text-sm px-4 py-2 bg-green-600 text-white">
                  ✅ ENTRADA AUTORIZADA Y REGISTRADA
                </Badge>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* Instrucciones */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 shadow">
          <h4 className="text-lg font-medium text-blue-900 mb-3">
            📋 Instrucciones de Uso
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-blue-800 mb-2">Scanner de Cámara:</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Active la cámara y apunte al código QR</li>
                <li>• Mantenga el código dentro del marco verde</li>
                <li>• La detección es automática</li>
                <li>• El acceso se registra instantáneamente</li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-medium text-blue-800 mb-2">Ingreso Manual:</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Copie y pegue el código QR</li>
                <li>• O escriba el código manualmente</li>
                <li>• Presione "Validar" para procesar</li>
                <li>• Solo códigos autorizados serán aceptados</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-100 rounded-md border border-blue-300">
            <p className="text-sm text-blue-800">
              <strong>Importante:</strong> Solo se aceptarán códigos QR de visitantes que hayan sido previamente aprobados por administración.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}