'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import * as securityService from '../../../lib/api/security';
import Link from 'next/link';
import { formatDate } from '../../../lib/utils';
import { Button } from '../../../components/ui/Button';
import { Alert, AlertTitle } from '../../../components/ui/Alert';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

interface Report {
  id: number;
  title: string;
  description: string;
  location: string;
  severity: string;
  status: string;
  report_type: string;
  report_type_display?: string;
  severity_display?: string;
  status_display?: string;
  reported_by_detail?: {
    username: string;
    first_name?: string;
    last_name?: string;
  };
  created_at: string;
  resolved_at?: string;
}

interface DashboardStats {
  total_reports: number;
  recent_reports: number;
  by_type: {
    alerts: number;
    emergencies: number;
    incidents: number;
    general: number;
  };
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
  recent_by_day: Array<{ date: string; count: number }>;
  top_reporters: Array<{ username: string; name: string; count: number }>;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [exporting, setExporting] = useState<boolean>(false);

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [selectedType, selectedStatus]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      let url = '/security/incidents/';
      const params = new URLSearchParams();
      
      if (selectedType !== 'all') {
        params.append('report_type', selectedType);
      }
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(`http://localhost:8000/api${url}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/security/incidents/dashboard_stats/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await fetch('http://localhost:8000/api/security/incidents/export_csv/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reportes_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      }
    } catch (err) {
      console.error('Error exporting:', err);
      alert('Error al exportar los reportes');
    } finally {
      setExporting(false);
    }
  };

  const handleStatusChange = async (reportId: number, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/security/incidents/${reportId}/change_status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        fetchReports();
        fetchStats();
      }
    } catch (err) {
      console.error('Error changing status:', err);
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-300';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'alert': return '🚨';
      case 'emergency': return '🆘';
      case 'incident': return '⚠️';
      case 'general': return '📋';
      default: return '📄';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Sistema de Reportes</h1>
          <div className="flex space-x-3">
            <Button
              onClick={handleExportCSV}
              disabled={exporting}
              variant="outline"
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              {exporting ? 'Exportando...' : '📥 Exportar CSV'}
            </Button>
            <Link href="/reports/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                + Crear Reporte
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <Alert variant="error" className="border-red-300 bg-red-50">
            <AlertTitle className="text-red-800">{error}</AlertTitle>
          </Alert>
        )}

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white shadow border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Reportes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_reports}</p>
                  </div>
                  <div className="text-3xl">📊</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Últimos 30 días</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.recent_reports}</p>
                  </div>
                  <div className="text-3xl">📅</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Emergencias</p>
                    <p className="text-2xl font-bold text-red-600">{stats.by_type.emergencies}</p>
                  </div>
                  <div className="text-3xl">🆘</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sin resolver</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.by_status.new + stats.by_status.in_progress}
                    </p>
                  </div>
                  <div className="text-3xl">⏳</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Reporte
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">Todos</option>
                <option value="alert">Alertas</option>
                <option value="emergency">Emergencias</option>
                <option value="incident">Incidentes</option>
                <option value="general">Reportes Generales</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">Todos</option>
                <option value="new">Nuevos</option>
                <option value="in_progress">En Progreso</option>
                <option value="resolved">Resueltos</option>
                <option value="closed">Cerrados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gráfico de actividad (últimos 7 días) */}
        {stats && stats.recent_by_day.length > 0 && (
          <Card className="bg-white shadow border border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-gray-900">Actividad de los últimos 7 días</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-end justify-between h-32 space-x-2">
                {stats.recent_by_day.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t"
                      style={{ 
                        height: `${day.count > 0 ? (day.count / Math.max(...stats.recent_by_day.map(d => d.count))) * 100 : 5}%`,
                        minHeight: '4px'
                      }}
                    ></div>
                    <span className="text-xs text-gray-600 mt-1">
                      {new Date(day.date).toLocaleDateString('es', { weekday: 'short' })}
                    </span>
                    <span className="text-xs font-medium text-gray-900">{day.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de reportes */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Reportes Recientes
            </h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {loading ? (
              [...Array(3)].map((_, index) => (
                <li key={index} className="px-4 py-4 sm:px-6 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="bg-gray-200 h-5 w-1/3 rounded"></div>
                    <div className="bg-gray-200 h-5 w-20 rounded"></div>
                  </div>
                  <div className="mt-2 bg-gray-200 h-4 w-1/2 rounded"></div>
                </li>
              ))
            ) : reports.length > 0 ? (
              reports.map((report) => (
                <li key={report.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">
                          {getTypeIcon(report.report_type)}
                        </span>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {report.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {report.description.substring(0, 100)}...
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                        <span>
                          Por: {report.reported_by_detail?.first_name || report.reported_by_detail?.username}
                        </span>
                        <span>•</span>
                        <span>{formatDate(report.created_at)}</span>
                        <span>•</span>
                        <span>{report.location}</span>
                      </div>
                      <div className="mt-2 flex items-center space-x-2">
                        <Badge className={getSeverityColor(report.severity)}>
                          {report.severity_display || report.severity}
                        </Badge>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status_display || report.status}
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                          {report.report_type_display || report.report_type}
                        </Badge>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col space-y-2">
                      <select
                        value={report.status}
                        onChange={(e) => handleStatusChange(report.id, e.target.value)}
                        className="text-sm border-gray-300 rounded-md"
                      >
                        <option value="new">Nuevo</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="resolved">Resuelto</option>
                        <option value="closed">Cerrado</option>
                      </select>
                      <Link href={`/reports/${report.id}`}>
                        <Button size="sm" variant="outline" className="w-full">
                          Ver Detalles
                        </Button>
                      </Link>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-6 sm:px-6 text-center text-gray-500">
                No hay reportes que coincidan con los filtros seleccionados.
              </li>
            )}
          </ul>
        </div>

        {/* Top Reportadores */}
        {stats && stats.top_reporters.length > 0 && (
          <Card className="bg-white shadow border border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-gray-900">Top Reportadores</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {stats.top_reporters.map((reporter, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-800">
                        {index + 1}
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        {reporter.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {reporter.count} reportes
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}