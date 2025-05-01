'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import DashboardLayout from '../../../../../../components/layout/DashboardLayout';
import { accessService } from '../../../../../../lib/api';
import { Alert, AlertTitle, AlertDescription } from '../../../../../../components/ui/Alert';
import { Button } from '../../../../../../components/ui/Button';
import Image from 'next/image';

// Definición de tipos
type Visitor = {
  id: number;
  first_name: string;
  last_name: string;
  id_number: string;
  company?: string;
  photo?: string;
};

type AccessZone = {
  id: number;
  name: string;
};

type VisitorAccessData = {
  visitor: string | number;
  purpose: string;
  valid_from: string;
  valid_to: string;
  access_zones: number[];
};

// Definir el tipo para la respuesta de creación de acceso de visitante
interface VisitorAccessResponse {
  id: number;
  visitor: number;
  host: number;
  purpose: string;
  valid_from: string;
  valid_to: string;
  qr_code: string;
  is_used: boolean;
  created_at: string;
  [key: string]: any; // Para cualquier propiedad adicional
}

type QRCodeResponse = {
  qr_code_image: string;
};

export default function CreateVisitorAccessPage() {
  const params = useParams();
  const visitorId = params.id as string;
  const router = useRouter();
  
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [accessZones, setAccessZones] = useState<AccessZone[]>([]);
  const [formData, setFormData] = useState<VisitorAccessData>({
    visitor: visitorId,
    purpose: '',
    valid_from: new Date().toISOString().slice(0, 16),
    valid_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    access_zones: []
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener información del visitante
        const visitorsResponse = await accessService.getVisitors();
        
        // Determinar si es un array o una respuesta paginada
        let visitors: Visitor[] = [];
        if (Array.isArray(visitorsResponse)) {
          visitors = visitorsResponse;
        } else if (visitorsResponse && visitorsResponse.results) {
          visitors = visitorsResponse.results;
        }
        
        // Encontrar el visitante específico
        const foundVisitor = visitors.find(v => v.id.toString() === visitorId);
        
        if (!foundVisitor) {
          throw new Error('Visitante no encontrado');
        }
        
        setVisitor(foundVisitor);
        
        // Obtener zonas de acceso disponibles
        const zonesResponse = await accessService.getAccessZones();
        
        // Determinar si es un array o una respuesta paginada
        let zones: AccessZone[] = [];
        if (Array.isArray(zonesResponse)) {
          zones = zonesResponse;
        } else if (zonesResponse && zonesResponse.results) {
          zones = zonesResponse.results;
        }
        
        setAccessZones(zones);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('No se pudo cargar la información necesaria');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [visitorId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleZonesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { options } = e.target;
    const selectedZones: number[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedZones.push(parseInt(options[i].value));
      }
    }
    setFormData((prev) => ({
      ...prev,
      access_zones: selectedZones
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      // Verificar que se han seleccionado zonas de acceso
      if (formData.access_zones.length === 0) {
        throw new Error('Debe seleccionar al menos una zona de acceso');
      }
      
      // Crear el acceso del visitante
      const response = await accessService.createVisitorAccess(formData) as VisitorAccessResponse;
      
      // Verificar que la respuesta tiene el formato esperado
      if (!response || typeof response !== 'object' || !('id' in response)) {
        console.error('Respuesta inválida:', response);
        throw new Error('Error al crear el acceso de visitante: respuesta inválida');
      }
      
      // Obtener el código QR
      const qrResponse = await accessService.getQRCode(response.id) as QRCodeResponse;
      
      if (!qrResponse || !qrResponse.qr_code_image) {
        throw new Error('Error al obtener el código QR');
      }
      
      setQrCode(qrResponse.qr_code_image);
    } catch (err: any) {
      console.error('Error creating visitor access:', err);
      
      // Manejar diferentes tipos de errores
      if (err.message) {
        setError(err.message);
      } else if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          setError(err.response.data);
        } else if (typeof err.response.data === 'object') {
          const errorMessages = Object.entries(err.response.data)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          setError(errorMessages || 'Error al crear acceso para el visitante');
        }
      } else {
        setError('Error al crear acceso para el visitante');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Crear Acceso para Visitante</h1>
        </div>

        {error && (
          <Alert variant="error">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {qrCode ? (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Acceso creado exitosamente
              </h3>
              <div className="mt-5 max-w-md mx-auto">
                <img src={qrCode} alt="QR Code" className="mx-auto" />
                <p className="mt-2 text-sm text-gray-500">
                  Escanee este código QR para permitir el acceso al visitante.
                </p>
              </div>
              <div className="mt-5">
                <Button
                  onClick={() => router.push('/access/visitors')}
                >
                  Volver a Visitantes
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {visitor && (
                <div className="mb-6 flex items-center">
                  <div className="flex-shrink-0 h-16 w-16 rounded-full overflow-hidden bg-gray-100">
                    {visitor.photo ? (
                      <Image 
                        src={visitor.photo}
                        alt={`${visitor.first_name} ${visitor.last_name}`}
                        width={64}
                        height={64}
                        className="h-16 w-16 object-cover"
                      />
                    ) : (
                      <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-medium text-gray-900">
                      {visitor.first_name} {visitor.last_name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      ID: {visitor.id_number} {visitor.company && `- ${visitor.company}`}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
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

                  <div className="sm:col-span-6">
                    <label htmlFor="access_zones" className="block text-sm font-medium text-gray-700">
                      Zonas de acceso
                    </label>
                    <div className="mt-1">
                      <select
                        id="access_zones"
                        name="access_zones"
                        multiple
                        required
                        onChange={handleZonesChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md h-32"
                      >
                        {accessZones.map((zone) => (
                          <option key={zone.id} value={zone.id}>
                            {zone.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Mantenga presionada la tecla Ctrl (o Command en Mac) para seleccionar varias zonas.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push('/access/visitors')}
                    className="mr-3"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    isLoading={submitting}
                    disabled={submitting}
                  >
                    {submitting ? 'Creando...' : 'Crear Acceso'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}