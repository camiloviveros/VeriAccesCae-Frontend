'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as securityService from '../../../../lib/api/security';
import { Button } from '../../../../components/ui/Button';
import { Alert, AlertTitle } from '../../../../components/ui/Alert';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';

interface UserReportData {
  total_reported: number;
  by_status: {
    new: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  last_30_days: number;
  recent_incidents: any[];
}

export default function UserReportsPage() {
  const router = useRouter();
  const [reportData, setReportData] = useState<UserReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchUserReport();
  }, [router]);

  const fetchUserReport = async () => {
    try {
      setLoading(true);
      const data = await securityService.getUserReport();
      setReportData(data);
    } catch (err) {
      console.error('Error fetching user report:', err);
      setError('No se pudo cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportData) return;

    // Crear contenido CSV
    let csv = 'Reporte de Incidentes de Seguridad\n\n';
    csv += 'Resumen General\n';
    csv += `Total de incidentes reportados,${reportData.total_reported}\n`;
    csv += `Incidentes últimos 30 días,${reportData.last_30_days}\n\n`;
    
    csv += 'Por Estado\n';
    csv += `Nuevos,${reportData.by_status.new}\n`;
    csv += `En Progreso,${reportData.by_status.in_progress}\n`;
    csv += `Resueltos,${reportData.by_status.resolved}\n`;
    csv += `Cerrados,${reportData.by_status.closed}\n\n`;
    
    csv += 'Por Severidad\n';
    csv += `Crítica,${reportData.by_severity.critical}\n`;
    csv += `Alta,${reportData.by_severity.high}\n`;
    csv += `Media,${reportData.by_severity.medium}\n`;
    csv += `Baja,${reportData.by_severity.low}\n`;

    // Descargar archivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_incidentes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-blue-600 shadow-sm text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">VeriAccessSCAE</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/user/dashboard" className="border-transparent text-blue-100 hover:border-white hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/user/visits" className="border-transparent text-blue-100 hover:border-white hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Mis Visitas
                </Link>
                <Link href="/user/reports" className="border-white text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Mis Reportes
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
                className="text-blue-100 hover:text-white text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Mis Reportes de Seguridad</h1>
            <Button
              onClick={downloadReport}
              disabled={loading || !reportData}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              📥 Descargar CSV
            </Button>
          </div>
          
          {error && (
            <Alert variant="error" className="mb-6 border-red-500 bg-red-50">
              <AlertTitle className="text-red-800">Error</AlertTitle>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : reportData ? (
            <div className="space-y-6">
              {/* Resumen general */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white shadow border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-xl font-bold">{reportData.total_reported}</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-600 truncate">Total Reportados</dt>
                          <dd className="text-lg font-medium text-gray-900">Por Ti</dd>
                        </dl>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-xl font-bold">{reportData.last_30_days}</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-600 truncate">Últimos 30 días</dt>
                          <dd className="text-lg font-medium text-gray-900">Incidentes</dd>
                        </dl>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-yellow-600 text-xl font-bold">
                            {reportData.by_status.new + reportData.by_status.in_progress}
                          </span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-600 truncate">Activos</dt>
                          <dd className="text-lg font-medium text-gray-900">En Proceso</dd>
                        </dl>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 text-xl font-bold">
                            {reportData.by_severity.critical + reportData.by_severity.high}
                          </span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-600 truncate">Alta Prioridad</dt>
                          <dd className="text-lg font-medium text-gray-900">Críticos</dd>
                        </dl>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos de estado y severidad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white shadow border border-gray-200">
                  <CardHeader className="bg-gray-50 border-b border-gray-200">
                    <CardTitle className="text-gray-900">Por Estado</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {Object.entries(reportData.by_status).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600 capitalize">
                            {status.replace('_', ' ')}
                          </span>
                          <div className="flex items-center">
                            <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ 
                                  width: `${reportData.total_reported > 0 
                                    ? (count / reportData.total_reported) * 100 
                                    : 0}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-8 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow border border-gray-200">
                  <CardHeader className="bg-gray-50 border-b border-gray-200">
                    <CardTitle className="text-gray-900">Por Severidad</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {Object.entries(reportData.by_severity).map(([severity, count]) => {
                        const colors: Record<string, string> = {
                          critical: 'bg-red-600',
                          high: 'bg-orange-600',
                          medium: 'bg-yellow-600',
                          low: 'bg-blue-600'
                        };
                        return (
                          <div key={severity} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600 capitalize">
                              {severity}
                            </span>
                            <div className="flex items-center">
                              <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className={`${colors[severity]} h-2 rounded-full`}
                                  style={{ 
                                    width: `${reportData.total_reported > 0 
                                      ? (count / reportData.total_reported) * 100 
                                      : 0}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900 w-8 text-right">
                                {count}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Incidentes recientes */}
              <Card className="bg-white shadow border border-gray-200">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <CardTitle className="text-gray-900">Tus Incidentes Recientes</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {reportData.recent_incidents.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {reportData.recent_incidents.map((incident) => (
                        <li key={incident.id} className="px-6 py-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                {incident.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {incident.location}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                ${incident.severity === 'critical' ? 'bg-red-100 text-red-800' : 
                                  incident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                  incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'}`}>
                                {incident.severity}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                ${incident.status === 'new' ? 'bg-blue-100 text-blue-800' : 
                                  incident.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                  incident.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'}`}>
                                {incident.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(incident.created_at).toLocaleDateString()}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-6 py-8 text-center text-gray-500">
                      No has reportado incidentes recientemente.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              No hay datos disponibles para mostrar.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}