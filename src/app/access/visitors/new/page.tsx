// src/app/access/visitors/new/page.tsx - Página para crear visitantes desde admin
'use client';

import DashboardLayout from '../../../../../components/layout/DashboardLayout';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../../components/ui/Card';

export default function NewVisitorPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Registrar Nuevo Visitante</h1>
            <p className="mt-1 text-sm text-gray-600">
              Seleccione el tipo de visitante que desea registrar
            </p>
          </div>
          <Link 
            href="/access/visitors" 
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ← Volver a Visitantes
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Visitante Normal */}
          <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
            <Link href="/access/visitors/new/regular">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 group-hover:from-blue-100 group-hover:to-blue-200 transition-colors duration-200">
                <CardTitle className="text-gray-900 flex items-center text-xl">
                  <span className="text-3xl mr-3">🏠</span>
                  Visitante Normal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">
                  Registre visitantes regulares que vienen a un apartamento específico.
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Ideal para familiares y amigos
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Se especifica número de apartamento
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Sin límite de tiempo
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Acceso controlado por administración
                  </li>
                </ul>
                <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                  Seleccionar tipo
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* Visitante Temporal */}
          <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
            <Link href="/access/visitors/new/temporary">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200 group-hover:from-orange-100 group-hover:to-orange-200 transition-colors duration-200">
                <CardTitle className="text-gray-900 flex items-center text-xl">
                  <span className="text-3xl mr-3">⏰</span>
                  Visitante Temporal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">
                  Registre visitantes con fecha y hora específicas de entrada y salida.
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Ideal para servicios o citas
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Fecha y hora de entrada/salida
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Acceso limitado en tiempo
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Vencimiento automático
                  </li>
                </ul>
                <div className="mt-4 flex items-center text-orange-600 text-sm font-medium">
                  Seleccionar tipo
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* Visitante Empresarial */}
          <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
            <Link href="/access/visitors/new/business">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200 group-hover:from-purple-100 group-hover:to-purple-200 transition-colors duration-200">
                <CardTitle className="text-gray-900 flex items-center text-xl">
                  <span className="text-3xl mr-3">🏢</span>
                  Visitante Empresarial
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">
                  Registre visitantes de empresas o representantes comerciales.
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Para representantes comerciales
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Incluye información de empresa
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Registro detallado de contacto
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Seguimiento empresarial
                  </li>
                </ul>
                <div className="mt-4 flex items-center text-purple-600 text-sm font-medium">
                  Seleccionar tipo
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Information Card */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Información sobre Visitantes</h4>
              <div className="text-sm text-blue-700 mt-1 space-y-1">
                <p>• <strong>Visitantes registrados desde administración:</strong> Se crean con estado "pendiente" y requieren aprobación.</p>
                <p>• <strong>Proceso de aprobación:</strong> Use el Control de Acceso para aprobar y gestionar el acceso físico.</p>
                <p>• <strong>Códigos QR:</strong> Solo están disponibles para visitantes aprobados.</p>
                <p>• <strong>Estados disponibles:</strong> Pendiente → Aprobado → Dentro/Fuera del edificio.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}