'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../../../components/layout/DashboardLayout';
import { Button } from '../../../../../components/ui/Button';
import { Alert, AlertTitle } from '../../../../../components/ui/Alert';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../../../components/ui/Card';
import { accessService } from '../../../../../lib/api';

export default function OccupancyControlPage() {
  const router = useRouter();
  const [occupancyCount, setOccupancyCount] = useState(0);
  const [maxOccupancy, setMaxOccupancy] = useState(100);
  const [message, setMessage] = useState('');
  const [visitorsInside, setVisitorsInside] = useState(0);
  const [totalInside, setTotalInside] = useState(0);
  
  // Obtener datos iniciales del aforo y visitantes
  useEffect(() => {
    // Carga desde localStorage (contador de residentes)
    const storedCount = localStorage.getItem('occupancyCount');
    if (storedCount) {
      const count = parseInt(storedCount, 10);
      setOccupancyCount(count);
    }
    
    // Cargar visitantes desde API
    const fetchVisitors = async () => {
      try {
        const response = await accessService.getVisitors();
        
        // Procesar la respuesta
        let visitors = [];
        if (Array.isArray(response)) {
          visitors = response;
        } else if (response.results && Array.isArray(response.results)) {
          visitors = response.results;
        } else if (typeof response === 'object') {
          visitors = Object.values(response).filter(v => 
            typeof v === 'object' && v !== null && 'id' in v
          );
        }
        
        // Contar visitantes con estado 'inside'
        const insideCount = visitors.filter(v => v.status === 'inside').length;
        setVisitorsInside(insideCount);
        
        // Actualizar total
        const residentCount = parseInt(storedCount || '0', 10);
        setTotalInside(residentCount + insideCount);
      } catch (err) {
        console.error('Error fetching visitors:', err);
      }
    };
    
    fetchVisitors();
  }, []);
  
  // Actualizar el total cuando cambia el contador o los visitantes
  useEffect(() => {
    setTotalInside(occupancyCount + visitorsInside);
  }, [occupancyCount, visitorsInside]);
  
  // Guardar cambios en localStorage cuando el contador cambie
  useEffect(() => {
    localStorage.setItem('occupancyCount', occupancyCount.toString());
  }, [occupancyCount]);
  
  const handleAddPerson = () => {
    if (occupancyCount < maxOccupancy) {
      setOccupancyCount(prevCount => prevCount + 1);
      setMessage('Persona agregada correctamente');
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } else {
      setMessage('No se puede agregar más personas. Se ha alcanzado la capacidad máxima.');
    }
  };
  
  const handleRemovePerson = () => {
    if (occupancyCount > 0) {
      setOccupancyCount(prevCount => prevCount - 1);
      setMessage('Persona removida correctamente');
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } else {
      setMessage('No hay personas para remover');
    }
  };
  
  // Calcular el porcentaje de ocupación
  const occupancyPercentage = (totalInside / maxOccupancy) * 100;
  
  // Determinar el color según el porcentaje de ocupación
  const getProgressColor = () => {
    if (occupancyPercentage < 50) return 'bg-green-500';
    if (occupancyPercentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Control de Aforo</h1>
          <Button
            onClick={() => router.push('/access/control')}
            variant="outline"
          >
            Volver al Control de Acceso
          </Button>
        </div>
        
        {message && (
          <Alert variant={message.includes('No se puede') || message.includes('No hay') ? 'warning' : 'success'}>
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        )}
        
        <Card className="w-full">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-center">Aforo del Edificio</CardTitle>
          </CardHeader>
          <CardContent className="py-8">
            <div className="text-center mb-4">
              <h2 className="text-5xl font-bold text-gray-900">{totalInside}/{maxOccupancy}</h2>
              <p className="text-lg text-gray-500 mt-2">Personas totales dentro del edificio</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <h3 className="text-xl font-semibold text-blue-700">{occupancyCount}</h3>
                <p className="text-sm text-blue-600">Residentes</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <h3 className="text-xl font-semibold text-green-700">{visitorsInside}</h3>
                <p className="text-sm text-green-600">Visitantes</p>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 mt-8">
              <div 
                className={`h-4 rounded-full ${getProgressColor()}`} 
                style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-center space-x-6 mt-8">
              <Button
                onClick={handleAddPerson}
                disabled={occupancyCount >= maxOccupancy}
                className="px-8 py-4 text-lg"
              >
                Agregar Residente
              </Button>
              <Button 
                variant="secondary"
                onClick={handleRemovePerson}
                disabled={occupancyCount <= 0}
                className="px-8 py-4 text-lg"
              >
                Remover Residente
              </Button>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t">
            <div className="w-full text-center text-sm text-gray-500">
              {totalInside === 0 ? (
                <p>El edificio está vacío</p>
              ) : totalInside >= maxOccupancy ? (
                <p className="text-red-500 font-medium">¡Aforo máximo alcanzado! No se permiten más entradas.</p>
              ) : occupancyPercentage >= 80 ? (
                <p className="text-yellow-600">El edificio está llegando a su capacidad máxima</p>
              ) : (
                <p>Aforo en niveles normales</p>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}