'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import * as reportService from '../../../lib/api/reports';
import Link from 'next/link';
import { formatDate } from '../../../lib/utils';
import { Button } from '../../../components/ui/Button';
import { Alert, AlertTitle } from '../../../components/ui/Alert';

interface Report {
  id: string;
  name: string;
  report_type: string;
  description?: string;
  created_at: string | Date;
  period: string;
}

interface ReportsResponse {
  results?: Report[];
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await reportService.getReports();
      
      const reportsData = Array.isArray(response) 
        ? response 
        : response.results || [];
      
      setReports(
        reportsData.map((report: any) => ({
          ...report,
          id: String(report.id),
        }))
      );
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (reportId: string, format: string = 'json') => {
    try {
      setGeneratingReport(reportId);
      const response = await reportService.generateReportWithFormat(reportId, { format });
      
      if (format === 'json') {
        // Mostrar los datos en consola o en un modal
        console.log('Datos del reporte:', response);
        alert('Reporte generado exitosamente. Ver consola para los datos.');
      } else {
        // Para CSV o Excel, el navegador debería descargar automáticamente
        alert('Reporte descargado exitosamente.');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Error al generar el reporte');
    } finally {
      setGeneratingReport(null);
    }
  };

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'access_logs': 'Registros de Acceso',
      'incidents': 'Incidentes de Seguridad',
      'attendance': 'Asistencia',
      'parking': 'Uso de Estacionamiento',
      'visitors': 'Estadísticas de Visitantes'
    };
    return labels[type] || type;
  };

  const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      'daily': 'Diario',
      'weekly': 'Semanal',
      'monthly': 'Mensual',
      'custom': 'Personalizado'
    };
    return labels[period] || period;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Reportes del Sistema</h1>
          <Link href="/reports/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              + Crear Nuevo Reporte
            </Button>
          </Link>
        </div>

        {error && (
          <Alert variant="error" className="border-red-300 bg-red-50">
            <AlertTitle className="text-red-800">{error}</AlertTitle>
          </Alert>
        )}

        {/* Reportes predefinidos rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Reporte Rápido - Visitantes Hoy</h3>
            <p className="text-sm text-gray-600 mb-3">Visitantes registrados en el día actual</p>
            <Button 
              size="sm"
              onClick={() => handleGenerateReport('visitors-today', 'json')}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Generar
            </Button>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Reporte Rápido - Accesos Semana</h3>
            <p className="text-sm text-gray-600 mb-3">Registros de acceso de los últimos 7 días</p>
            <Button 
              size="sm"
              onClick={() => handleGenerateReport('access-week', 'json')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Generar
            </Button>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Reporte Rápido - Incidentes Mes</h3>
            <p className="text-sm text-gray-600 mb-3">Incidentes de seguridad del último mes</p>
            <Button 
              size="sm"
              onClick={() => handleGenerateReport('incidents-month', 'json')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              Generar
            </Button>
          </div>
        </div>

        {/* Lista de reportes configurados */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Reportes Configurados
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Reportes personalizados creados por administradores
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {loading ? (
              [...Array(3)].map((_, index) => (
                <li key={index} className="px-4 py-4 sm:px-6 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="bg-gray-200 h-5 w-1/3 rounded"></div>
                    <div className="bg-gray-200 h-5 w-20 rounded"></div>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
                    <div className="bg-gray-200 h-4 w-24 rounded"></div>
                  </div>
                </li>
              ))
            ) : reports.length > 0 ? (
              reports.map((report) => (
                <li key={report.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-blue-600 truncate">
                        {report.name}
                      </h4>
                      <p className="mt-1 text-sm text-gray-600">
                        {report.description || 'Sin descripción'}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                          {getReportTypeLabel(report.report_type)}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {getPeriodLabel(report.period)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateReport(report.id, 'json')}
                        disabled={generatingReport === report.id}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        {generatingReport === report.id ? 'Generando...' : 'Ver Datos'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateReport(report.id, 'csv')}
                        disabled={generatingReport === report.id}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        CSV
                      </Button>
                      <Link href={`/reports/${report.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-gray-600 border-gray-200 hover:bg-gray-50"
                        >
                          Editar
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Creado: {formatDate(report.created_at)}
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-6 sm:px-6 text-center text-gray-500">
                No hay reportes configurados. Crea tu primer reporte personalizado.
              </li>
            )}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}