// src/app/access/visitors/new/page.tsx
'use client';

import DashboardLayout from '../../../../../components/layout/DashboardLayout';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../../components/ui/Card';

export default function NewVisitorPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Registrar Nuevo Visitante</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Visitante Normal */}
          <Card>
            <CardHeader>
              <CardTitle>Visitante Normal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Registre visitantes regulares que vienen a un apartamento específico.
              </p>
              <Link 
                href="/access/visitors/new/regular"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 w-full justify-center"
              >
                Registrar Visitante Normal
              </Link>
            </CardContent>
          </Card>

          {/* Visitante Temporal */}
          <Card>
            <CardHeader>
              <CardTitle>Visitante Temporal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Registre visitantes con fecha y hora de entrada y salida específicas.
              </p>
              <Link 
                href="/access/visitors/new/temporary"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 w-full justify-center"
              >
                Registrar Visitante Temporal
              </Link>
            </CardContent>
          </Card>

          {/* Visitante Empresarial */}
          <Card>
            <CardHeader>
              <CardTitle>Visitante Empresarial</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Registre visitantes de empresas o representantes comerciales.
              </p>
              <Link 
                href="/access/visitors/new/business"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 w-full justify-center"
              >
                Registrar Visitante Empresarial
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}