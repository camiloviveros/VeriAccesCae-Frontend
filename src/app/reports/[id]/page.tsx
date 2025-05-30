'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { formatDate } from '../../../lib/utils';

interface ReportDetail {
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
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

interface Comment {
  id: number;
  user_detail: {
    username: string;
    first_name?: string;
    last_name?: string;
  };
  comment: string;
  created_at: string;
  is_system_comment: boolean;
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchReportDetail();
    fetchComments();
  }, [reportId]);

  const fetchReportDetail = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/security/incidents/${reportId}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/security/incidents/${reportId}/comments/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const response = await fetch(`http://localhost:8000/api/security/incidents/${reportId}/comments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ comment: newComment })
      });

      if (response.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
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
        fetchReportDetail();
        fetchComments();
      }
    } catch (err) {
      console.error('Error changing status:', err);
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!report) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <p className="text-gray-500">Reporte no encontrado</p>
          <Button onClick={() => router.push('/reports')} className="mt-4">
            Volver a Reportes
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/reports')}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              ← Volver
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Detalle del Reporte</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={getSeverityColor(report.severity)}>
              {report.severity_display || report.severity}
            </Badge>
            <Badge className={getStatusColor(report.status)}>
              {report.status_display || report.status}
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Details */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow">
              <CardHeader className="bg-gray-50">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getTypeIcon(report.report_type)}</span>
                  <CardTitle>{report.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Descripción</h4>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">{report.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Ubicación</h4>
                    <p className="mt-1 text-gray-900">{report.location}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Reportado por</h4>
                      <p className="mt-1 text-gray-900">
                        {report.reported_by_detail?.first_name} {report.reported_by_detail?.last_name}
                        <span className="text-gray-500 text-sm"> (@{report.reported_by_detail?.username})</span>
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Fecha de creación</h4>
                      <p className="mt-1 text-gray-900">{formatDate(report.created_at)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card className="bg-white shadow mt-6">
              <CardHeader className="bg-gray-50">
                <CardTitle>Comentarios</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className={`p-4 rounded-lg ${comment.is_system_comment ? 'bg-blue-50' : 'bg-gray-50'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-medium text-sm">
                            {comment.user_detail.first_name || comment.user_detail.username}
                          </span>
                          {comment.is_system_comment && (
                            <Badge className="ml-2 text-xs">Sistema</Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">{comment.comment}</p>
                    </div>
                  ))}
                  
                  {comments.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No hay comentarios aún</p>
                  )}
                </div>
                
                {/* Add Comment */}
                <div className="mt-4 space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Agregar un comentario..."
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={submittingComment || !newComment.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {submittingComment ? 'Enviando...' : 'Agregar Comentario'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow">
              <CardHeader className="bg-gray-50">
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cambiar Estado
                    </label>
                    <select
                      value={report.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="new">Nuevo</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="resolved">Resuelto</option>
                      <option value="closed">Cerrado</option>
                    </select>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Información</h4>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-gray-500">ID del Reporte</dt>
                        <dd className="font-medium">#{report.id}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Tipo</dt>
                        <dd className="font-medium">{report.report_type_display || report.report_type}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Última actualización</dt>
                        <dd className="font-medium">{formatDate(report.updated_at)}</dd>
                      </div>
                      {report.resolved_at && (
                        <div>
                          <dt className="text-gray-500">Resuelto el</dt>
                          <dd className="font-medium">{formatDate(report.resolved_at)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}