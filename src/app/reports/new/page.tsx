'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import * as reportService from '../../../../lib/api/reports';
import { Button } from '../../../../components/ui/Button';
import { Alert, AlertTitle } from '../../../../components/ui/Alert';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';

export default function CreateReportPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    report_type: 'access_logs',
    period: 'daily'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await reportService.createReport(formData);
      router.push('/reports');
    } catch (err: any) {
      console.error('Error creating report:', err);
      setError(err.message || 'Error al crear el reporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Crear Nuevo Reporte</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure un nuevo reporte para generar estadísticas del sistema.
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6 border-red-300 bg-red-50">
            <AlertTitle className="text-red-800">{error}</AlertTitle>
          </Alert>
        )}

        <Card className="bg-white shadow-lg border border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-gray-900">Configuración del Reporte</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nombre del Reporte
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Ej: Reporte Semanal de Accesos"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Describe el propósito de este reporte..."
                />
              </div>

              <div>
                <label htmlFor="report_type" className="block text-sm font-medium text-gray-700">
                  Tipo de Reporte
                </label>
                <select
                  id="report_type"
                  name="report_type"
                  value={formData.report_type}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="access_logs">Registros de Acceso</option>
                  <option value="visitors">Estadísticas de Visitantes</option>
                  <option value="incidents">Incidentes de Seguridad</option>
                  <option value="attendance">Asistencia</option>
                  <option value="parking">Uso de Estacionamiento</option>
                </select>
              </div>

              <div>
                <label htmlFor="period" className="block text-sm font-medium text-gray-700">
                  Período
                </label>
                <select
                  id="period"
                  name="period"
                  value={formData.period}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Información</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Los reportes diarios incluyen datos del día actual</li>
                  <li>• Los reportes semanales abarcan los últimos 7 días</li>
                  <li>• Los reportes mensuales cubren los últimos 30 días</li>
                  <li>• Los reportes personalizados permiten seleccionar fechas específicas</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/reports')}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={loading}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Crear Reporte
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}