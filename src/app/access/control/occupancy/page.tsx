// src/app/access/control/occupancy/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../../../components/layout/DashboardLayout';
import { Button } from '../../../../../components/ui/Button';
import { Alert, AlertTitle } from '../../../../../components/ui/Alert';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../../../components/ui/Card';
import { accessService } from '../../../../../lib/api';
import { Loading } from '../../../../../components/ui/Loading';

interface OccupancyData {
  id: number;
  residents_count: number;
  visitors_count: number;
  total_count: number;
  max_capacity: number;
  last_updated: string;
}

export default function OccupancyControlPage() {
  const router = useRouter();
  const [occupancyData, setOccupancyData] = useState<OccupancyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Cargar datos de aforo desde la API
  useEffect(() => {
    fetchOccupancyData();

    // Actualizar cada 5 segundos
    const interval = setInterval(() => {
      fetchOccupancyData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchOccupancyData = async () => {
    try {
      const data = await accessService.getCurrentOccupancy();
      setOccupancyData(data);
      setError('');
    } catch (err) {
      console.error('Error fetching occupancy data:', err);
      setError('Error al cargar los datos de aforo');
    } finally {
      setLoading(false);
    }
  };

  const handleAddResident = async () => {
    if (!occupancyData) return;
    
    if (occupancyData.total_count >= occupancyData.max_capacity) {
      setMessage('No se puede agregar más personas. Se ha alcanzado la capacidad máxima.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setUpdating(true);
      const updatedData = await accessService.updateResidentsCount(occupancyData.residents_count + 1);
      setOccupancyData(updatedData);
      setMessage('Residente agregado correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error adding resident:', err);
      setError('Error al agregar residente');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveResident = async () => {
    if (!occupancyData) return;
    
    if (occupancyData.residents_count <= 0) {
      setMessage('No hay residentes para remover');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setUpdating(true);
      const updatedData = await accessService.updateResidentsCount(occupancyData.residents_count - 1);
      setOccupancyData(updatedData);
      setMessage('Residente removido correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error removing resident:', err);
      setError('Error al remover residente');
    } finally {
      setUpdating(false);
    }
  };

  // Calcular el porcentaje de ocupación
  const occupancyPercentage = occupancyData 
    ? (occupancyData.total_count / occupancyData.max_capacity) * 100 
    : 0;

  // Determinar el color según el porcentaje de ocupación
  const getProgressColor = () => {
    if (occupancyPercentage < 50) return 'bg-green-500';
    if (occupancyPercentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressBorderColor = () => {
    if (occupancyPercentage < 50) return 'border-green-500';
    if (occupancyPercentage < 80) return 'border-yellow-500';
    return 'border-red-500';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loading size="lg" message="Cargando datos de aforo..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Control de Aforo</h1>
          <Button
            onClick={() => router.push('/access/control')}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Volver al Control de Acceso
          </Button>
        </div>
        
        {error && (
          <Alert variant="error" className="border-red-300 bg-red-50">
            <AlertTitle className="text-red-800">{error}</AlertTitle>
          </Alert>
        )}
        
        {message && (
          <Alert variant={message.includes('No se puede') || message.includes('No hay') ? 'warning' : 'success'} 
                 className={message.includes('No se puede') || message.includes('No hay') ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-green-50'}>
            <AlertTitle className={message.includes('No se puede') || message.includes('No hay') ? 'text-yellow-800' : 'text-green-800'}>
              {message}
            </AlertTitle>
          </Alert>
        )}
        
        <Card className="w-full shadow-lg border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-center text-gray-800">Aforo del Edificio</CardTitle>
          </CardHeader>
          <CardContent className="py-8">
            <div className="text-center mb-4">
              <h2 className="text-5xl font-bold text-gray-900">
                {occupancyData?.total_count || 0}/{occupancyData?.max_capacity || 100}
              </h2>
              <p className="text-lg text-gray-600 mt-2">Personas totales dentro del edificio</p>
              {occupancyData && (
                <p className="text-sm text-gray-500 mt-1">
                  Última actualización: {new Date(occupancyData.last_updated).toLocaleTimeString()}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
                <h3 className="text-xl font-semibold text-blue-700">
                  {occupancyData?.residents_count || 0}
                </h3>
                <p className="text-sm text-blue-600">Residentes</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
                <h3 className="text-xl font-semibold text-green-700">
                  {occupancyData?.visitors_count || 0}
                </h3>
                <p className="text-sm text-green-600">Visitantes</p>
              </div>
            </div>
            
            <div className={`w-full bg-gray-200 rounded-full h-4 mt-8 border ${getProgressBorderColor()}`}>
              <div 
                className={`h-4 rounded-full ${getProgressColor()} transition-all duration-500`} 
                style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-center space-x-6 mt-8">
              <Button
                onClick={handleAddResident}
                disabled={updating || (occupancyData?.total_count ?? 0) >= (occupancyData?.max_capacity ?? 0)}
                className="px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
              >
                {updating ? '⏳ Procesando...' : '➕ Agregar Residente'}
              </Button>
              <Button 
                variant="secondary"
                onClick={handleRemoveResident}
                disabled={updating || (occupancyData?.residents_count ?? 0) <= 0}
                className="px-8 py-4 text-lg bg-gray-600 hover:bg-gray-700 text-white disabled:bg-gray-400"
              >
                {updating ? '⏳ Procesando...' : '➖ Remover Residente'}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t border-gray-200">
            <div className="w-full text-center text-sm text-gray-600">
              {occupancyData?.total_count === 0 ? (
                <p>El edificio está vacío</p>
              ) : occupancyData && occupancyData.total_count >= occupancyData.max_capacity ? (
                <p className="text-red-600 font-medium">¡Aforo máximo alcanzado! No se permiten más entradas.</p>
              ) : occupancyPercentage >= 80 ? (
                <p className="text-yellow-600">El edificio está llegando a su capacidad máxima</p>
              ) : (
                <p>Aforo en niveles normales</p>
              )}
              
              {/* Indicador de actualización en tiempo real */}
              <div className="mt-2 flex items-center justify-center text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                Datos en tiempo real
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Información adicional */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Sistema de Aforo Persistente</h4>
              <div className="text-sm text-blue-700 mt-1">
                <p>• Los datos se almacenan en la base de datos y persisten entre sesiones</p>
                <p>• El conteo de visitantes se actualiza automáticamente al escanear QR</p>
                <p>• Los residentes se gestionan manualmente desde este panel</p>
                <p>• La información se actualiza en tiempo real cada 5 segundos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}