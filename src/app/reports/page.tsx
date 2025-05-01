'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { reportService } from '../../../lib/api';
import Link from 'next/link';
import { formatDate } from '../../../lib/utils';

interface Report {
  id: string;
  name: string;
  report_type: string;
  description?: string;
  created_at: string | Date;
}

interface ReportsResponse {
  results?: Report[];
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await reportService.getReports() as ReportsResponse | Report[];
        
        // Normalize response (could be array or object with results property)
        const reportsData = Array.isArray(response) 
          ? response 
          : response.results || [];
        
        setReports(reportsData);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('No se pudieron cargar los reportes');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Reportes</h1>
          <Link 
            href="/reports/new" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Crear Reporte
          </Link>
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

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
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
                <li key={report.id} className="hover:bg-gray-50">
                  <Link href={`/reports/${report.id}`} className="block px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-primary-600 truncate">
                        {report.name}
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                          {report.report_type}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {report.description || 'Sin descripción'}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          {formatDate(report.created_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <li className="px-4 py-6 sm:px-6 text-center text-gray-500">
                No hay reportes disponibles.
              </li>
            )}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}