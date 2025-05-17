// src/app/access/visitors/[id]/qr/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../../../../components/layout/DashboardLayout';
import { accessService } from '../../../../../../lib/api';
import { Alert, AlertTitle } from '../../../../../../components/ui/Alert';
import { Button } from '../../../../../../components/ui/Button';
import { Loading } from '../../../../../../components/ui/Loading';

interface Visitor {
  id: number;
  first_name: string;
  last_name: string;
  id_number: string;
}

interface QRAccessData {
  visitor: number;
  purpose: string;
  valid_from: string;
  valid_to: string;
  access_zones: number[];
}

export default function VisitorQRPage() {
  const params = useParams();
  const router = useRouter();
  const visitorId = params.id as string;

  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [accessId, setAccessId] = useState<number | null>(null);
  const [formData, setFormData] = useState<QRAccessData>({
    visitor: parseInt(visitorId),
    purpose: 'Visita',
    valid_from: '',
    valid_to: '',
    access_zones: [1] // Por defecto la primera zona
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchVisitorDetails = async () => {
      try {
        setLoading(true);
        const visitorsResponse = await accessService.getVisitors();
        
        let visitors: Visitor[] = [];
        if (Array.isArray(visitorsResponse)) {
          visitors = visitorsResponse;
        } else if (visitorsResponse.results && Array.isArray(visitorsResponse.results)) {
          visitors = visitorsResponse.results;
        }
        
        const foundVisitor = visitors.find(v => v.id.toString() === visitorId);
        
        if (foundVisitor) {
          setVisitor(foundVisitor);
          
          // Inicializar fechas predeterminadas
          const now = new Date();
          const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
          
          setFormData(prev => ({
            ...prev,
            visitor: foundVisitor.id,
            valid_from: now.toISOString().slice(0, 16),
            valid_to: inOneHour.toISOString().slice(0, 16)
          }));
        } else {
          setError('Visitante no encontrado');
        }
      } catch (err) {
        console.error('Error fetching visitor details:', err);
        setError('No se pudo cargar la información del visitante');
      } finally {
        setLoading(false);
      }
    };

    fetchVisitorDetails();
  }, [visitorId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      // Validación de fechas
      const validFrom = new Date(formData.valid_from);
      const validTo = new Date(formData.valid_to);
      
      if (validFrom >= validTo) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }
      
      // Crear el acceso de visitante
      const response = await accessService.createVisitorAccess(formData);
      setAccessId(response.id);
      
      // Obtener la imagen QR
      const qrResponse = await accessService.getQRCode(response.id);
      setQrImage(qrResponse.qr_code_image);
      
      setSuccess('Código QR generado exitosamente');
    } catch (err: any) {
      console.error('Error creating QR access:', err);
      setError(err.message || 'Error al generar el código QR');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loading size="lg" message="Cargando información del visitante..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Generar QR de Acceso</h1>
          <Button variant="outline" onClick={() => router.push('/access/visitors')}>
            Volver
          </Button>
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

        {visitor && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Generar acceso para: {visitor.first_name} {visitor.last_name}
              </h3>
              <p className="mt-1 text-sm text-gray-500">ID: {visitor.id_number}</p>
            </div>

            {qrImage ? (
              <div className="px-4 py-5 sm:p-6 flex flex-col items-center">
                <div className="mb-4 text-lg font-semibold text-center">
                  Código QR generado
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
                  >
                    Descargar QR
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setQrImage(null);
                      setAccessId(null);
                    }}
                  >
                    Generar otro
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
                      Propósito de la visita
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="purpose"
                        id="purpose"
                        required
                        value={formData.purpose}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="valid_from" className="block text-sm font-medium text-gray-700">
                      Válido desde
                    </label>
                    <div className="mt-1">
                      <input
                        type="datetime-local"
                        name="valid_from"
                        id="valid_from"
                        required
                        value={formData.valid_from}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="valid_to" className="block text-sm font-medium text-gray-700">
                      Válido hasta
                    </label>
                    <div className="mt-1">
                      <input
                        type="datetime-local"
                        name="valid_to"
                        id="valid_to"
                        required
                        value={formData.valid_to}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    isLoading={submitting}
                    disabled={submitting}
                  >
                    Generar QR
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}