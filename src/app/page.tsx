'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Verificar si el usuario ya está autenticado
    const token = localStorage.getItem('access_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra de navegación */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">VeriAccessSCAE</h1>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-800 transition duration-300 sm:text-base">
                Iniciar sesión
              </Link>
              <Link href="/auth/register" className="ml-4 sm:ml-6 inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-all duration-300 transform hover:scale-105">
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Sección de hero */}
      <div className="relative">
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gray-100"></div>
        <div className="max-w-7xl mx-auto sm:px-6 px-4 lg:px-8">
          <div className="relative shadow-lg sm:rounded-2xl rounded-lg sm:overflow-hidden bg-gradient-to-r from-gray-800 to-gray-700">
            <div className="relative px-4 py-12 sm:px-6 sm:py-20 lg:py-32 lg:px-8">
              <h1 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-6xl">
                <span className="block text-white">Sistema de Control de Acceso</span>
                <span className="block text-blue-100 mt-2">para Edificios</span>
              </h1>
              <p className="mt-6 max-w-lg mx-auto text-center text-lg sm:text-xl text-white sm:max-w-3xl">
                Gestione de manera segura y eficiente los accesos a sus instalaciones con VeriAccessSCAE.
              </p>
              <div className="mt-8 sm:mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                  <Link
                    href="/auth/register"
                    className="w-full transform hover:scale-105 flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md shadow-md text-gray-800 bg-white hover:bg-gray-50 transition-all duration-300 ease-in-out sm:px-8"
                  >
                    Comenzar
                  </Link>
                  <Link
                    href="/auth/login"
                    className="w-full transform hover:scale-105 flex items-center justify-center px-4 py-3 border border-blue-300 text-base font-medium rounded-md shadow-md text-white bg-blue-500 bg-opacity-60 hover:bg-opacity-80 transition-all duration-300 ease-in-out sm:px-8"
                  >
                    Iniciar sesión
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Características */}
      <div className="py-8 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-gray-600 font-semibold tracking-wide uppercase">Características</h2>
            <p className="mt-2 text-2xl sm:text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Control de acceso inteligente
            </p>
            <p className="mt-4 max-w-2xl text-lg sm:text-xl text-gray-600 lg:mx-auto">
              Un sistema completo para gestionar y monitorear el acceso a sus instalaciones.
            </p>
          </div>

          <div className="mt-8 sm:mt-10">
            <dl className="space-y-8 md:space-y-0 md:grid md:grid-cols-1 sm:grid-cols-2 md:gap-x-8 md:gap-y-8">
              <div className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transform hover:translate-y-[-5px] transition-all duration-300 border border-gray-200">
                <dt>
                  <div className="absolute flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-gray-700 text-white">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="ml-14 sm:ml-16 text-lg leading-6 font-medium text-gray-900">Control de acceso seguro</p>
                </dt>
                <dd className="mt-2 ml-14 sm:ml-16 text-base text-gray-600">
                  Gestione el acceso a sus instalaciones con tecnología avanzada y segura.
                </dd>
              </div>

              <div className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transform hover:translate-y-[-5px] transition-all duration-300 border border-gray-200">
                <dt>
                  <div className="absolute flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-gray-700 text-white">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <p className="ml-14 sm:ml-16 text-lg leading-6 font-medium text-gray-900">Reportes detallados</p>
                </dt>
                <dd className="mt-2 ml-14 sm:ml-16 text-base text-gray-600">
                  Obtenga informes detallados sobre los accesos y eventos de seguridad.
                </dd>
              </div>

              <div className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transform hover:translate-y-[-5px] transition-all duration-300 border border-gray-200">
                <dt>
                  <div className="absolute flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-gray-700 text-white">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <p className="ml-14 sm:ml-16 text-lg leading-6 font-medium text-gray-900">Monitoreo en tiempo real</p>
                </dt>
                <dd className="mt-2 ml-14 sm:ml-16 text-base text-gray-600">
                  Visualice todos los eventos de acceso en tiempo real desde cualquier dispositivo.
                </dd>
              </div>

              <div className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transform hover:translate-y-[-5px] transition-all duration-300 border border-gray-200">
                <dt>
                  <div className="absolute flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-gray-700 text-white">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="ml-14 sm:ml-16 text-lg leading-6 font-medium text-gray-900">Respuesta rápida</p>
                </dt>
                <dd className="mt-2 ml-14 sm:ml-16 text-base text-gray-600">
                  Actúe rápidamente ante cualquier incidente de seguridad o acceso no autorizado.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Banner de seguridad */}
      <div className="bg-gray-50 overflow-hidden">
        <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="relative lg:grid lg:grid-cols-3 lg:gap-x-8">
            <div className="lg:col-span-1">
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Seguridad avanzada para su edificio
              </h2>
            </div>
            <div className="mt-10 sm:mt-0 lg:col-span-2">
              <div className="prose prose-blue text-gray-600">
                <p>
                  Nuestro sistema de control de acceso está diseñado con los más altos estándares de seguridad. 
                  Utilizamos tecnología biométrica, tarjetas inteligentes y códigos de acceso para proteger 
                  sus instalaciones contra accesos no autorizados.
                </p>
                <p>
                  Además, ofrecemos integración con sistemas de videovigilancia y alarmas para una 
                  seguridad completa. Todo gestionado desde una interfaz intuitiva.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Soluciones</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    Control de acceso
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    Videovigilancia
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    Gestión de visitantes
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Empresa</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    Acerca de
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    Contacto
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    Soporte
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Legal</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    Privacidad
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    Términos
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Redes sociales</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="flex items-center text-gray-400 hover:text-white">
                    <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                    Facebook
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center text-gray-400 hover:text-white">
                    <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center text-gray-400 hover:text-white">
                    <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.992 18.332A8.53 8.53 0 0 1 12.001 20a8.53 8.53 0 0 1-5.992-1.668l.011-.008 2.306-.623.002-.001c.321.186.641.344.977.469a7.47 7.47 0 0 0 2.695.524 7.47 7.47 0 0 0 2.696-.524 7.483 7.483 0 0 0 .976-.469l.002.001 2.306.623.012.008zm2.33-2.274l-3.126-.844a98.733 98.733 0 0 1-1.654-.473 9.53 9.53 0 0 1-2.539-.635 4.692 4.692 0 0 1-1.003-.578 4.385 4.385 0 0 1-.358-.297l-.041-.041c-.584-.584-.584-1.499-.584-1.499V8.405c0-1.8.831-2.801 2.182-3.341a7.465 7.465 0 0 1 5.798 0c1.35.54 2.182 1.541 2.182 3.341v3.286s0 .915-.584 1.499l-.04.041c-.101.103-.223.199-.359.297a4.693 4.693 0 0 1-1.002.578 9.53 9.53 0 0 1-2.539.635 98.74 98.74 0 0 1-1.655.473l-3.126.844a8.518 8.518 0 0 0 8.322-8.518c0-4.709-3.809-8.518-8.518-8.518S3.484 7.296 3.484 12a8.518 8.518 0 0 0 8.324 8.518z" />
                    </svg>
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8">
            <p className="text-base text-gray-400 xl:text-center">
              &copy; 2023 VeriAccessSCAE. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}