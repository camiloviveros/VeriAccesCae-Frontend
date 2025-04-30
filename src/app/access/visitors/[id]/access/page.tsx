'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import DashboardLayout from '../../../../../../components/layout/DashboardLayout';
import { accessService } from '../../../../../../lib/api';
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

type QRCodeResponse = {
  qr_code_image: string;
};

type AccessZonesResponse = {
  results?: AccessZone[];
} | AccessZone[];

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
        const visitorResponse = await accessService.getVisitors();
        // Filtrar el visitante específico basado en el ID
        const foundVisitor = Array.isArray(visitorResponse) 
          ? visitorResponse.find(v => v.id.toString() === visitorId)
          : null;
        
        if (!foundVisitor) {
          throw new Error('Visitante no encontrado');
        }
        
        setVisitor(foundVisitor as Visitor);
        
        // Obtener zonas de acceso disponibles
        const zonesResponse = await accessService.getAccessZones() as AccessZonesResponse;
        const zones = Array.isArray(zonesResponse) 
          ? zonesResponse 
          : (zonesResponse.results || []);
        
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Crear el acceso del visitante
      const response = await accessService.createVisitorAccess(formData);
      
      // Obtener el código QR
      const qrResponse = await accessService.getQRCode((response as {id: string | number}).id) as QRCodeResponse;
      setQrCode(qrResponse.qr_code_image);
    } catch (err) {
      console.error('Error creating visitor access:', err);
      setError((err as {response?: {data?: {error?: string}}}).response?.data?.error || 'Error al crear acceso para el visitante');
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
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
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
                <button
                  type="button"
                  onClick={() => router.push('/access/visitors')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Volver a Visitantes
                </button>
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
                  <button
                    type="button"
                    onClick={() => router.push('/access/visitors')}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
                  >
                    {submitting ? 'Creando...' : 'Crear Acceso'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}