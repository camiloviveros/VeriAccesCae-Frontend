import axios from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Variable para verificar si estamos en el navegador
export const isBrowser = typeof window !== 'undefined';

// Cliente axios con configuración base
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Agregar timeout para evitar solicitudes que queden colgadas indefinidamente
  timeout: 30000, // Aumentado a 30 segundos para operaciones más lentas
});

// Interceptor para añadir el token a las solicitudes
apiClient.interceptors.request.use(
  (config) => {
    // Asegurarse de que estamos en el cliente antes de acceder a localStorage
    if (isBrowser) {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // Agregar registro de solicitud para depuración
    console.log(`Request sent to: ${config.url}`, { 
      method: config.method,
      data: config.data,
      params: config.params
    });
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de token expirado
apiClient.interceptors.response.use(
  (response) => {
    // Log de respuesta exitosa para depuración
    console.log(`Response from ${response.config.url}:`, {
      status: response.status,
      statusText: response.statusText
    });
    return response;
  },
  async (error) => {
    // Verificar si error.config está definido
    const originalRequest = error.config 
      ? { ...error.config, _retry: error.config._retry || false } 
      : { _retry: false, url: null };
    
    // Log detallado del error para depuración
    console.error('API Error:', {
      request: {
        url: originalRequest.url,
        method: originalRequest.method,
        data: originalRequest.data
      },
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No response',
      message: error.message
    });
    
    // Si el error es 401 y no es un reintento y no es un intento de login
    if (error.response?.status === 401 && !originalRequest._retry && 
        originalRequest.url !== `${API_URL}/auth/login/` && 
        isBrowser) {
      originalRequest._retry = true;
      
      try {
        // Intentar refrescar el token
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        console.log('Intentando refrescar el token...');
        const response = await axios.post<{access: string}>(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        
        // Guardar el nuevo token
        localStorage.setItem('access_token', response.data.access);
        console.log('Token refrescado exitosamente');
        
        // Actualizar el header y reenviar la solicitud
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        // Si falla el refresh, limpiar el almacenamiento
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        // Solo redirigir si estamos en el navegador
        if (isBrowser) {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    // Manejo mejorado de errores específicos
    if (error.response) {
      let errorMessage = '';
      
      switch (error.response.status) {
        case 400:
          console.error('API Error: Bad Request (400) - Solicitud incorrecta', {
            url: error.config?.url || 'unknown',
            method: error.config?.method || 'unknown',
            data: error.response.data || 'No data'
          });
          break;
        case 403:
          console.error('API Error: Forbidden (403) - No tienes permisos para acceder a este recurso', {
            url: error.config?.url || 'unknown',
            method: error.config?.method || 'unknown'
          });
          break;
        case 404:
          console.error('API Error: Not Found (404) - Recurso no encontrado', {
            url: error.config?.url || 'unknown',
            method: error.config?.method || 'unknown'
          });
          break;
        case 500:
          console.error('API Error: Server Error (500) - Error interno del servidor', {
            url: error.config?.url || 'unknown',
            method: error.config?.method || 'unknown'
          });
          
          // Proporcionar información más útil para errores 500
          if (error.config?.url?.includes('/access/visitors/')) {
            console.warn('Este error 500 puede estar relacionado con el endpoint de visitantes. Verificar la conexión con el backend o problemas de modelado de datos.');
            
            // Intento de manejo especial para errores en visitantes
            if (originalRequest.method === 'get') {
              console.info('Intentando recuperarse del error 500 en getVisitors devolviendo un array vacío');
              return { data: [] };
            }
            else if (originalRequest.method === 'post' || originalRequest.method === 'patch') {
              // For POST/PATCH, let the error propagate but with a clearer message
              console.error('Error al crear o actualizar visitante - posible problema con el campo status');
              const enhancedError = new Error('Error al procesar visitante: La base de datos puede necesitar migración para agregar campos necesarios');
              throw enhancedError;
            }
          }
          break;
        default:
          console.error('API Error:', {
            status: error.response.status,
            statusText: error.response.statusText,
            url: error.config?.url || 'unknown',
            method: error.config?.method || 'unknown',
            data: error.response.data || 'No data'
          });
      }
      
      // Extraer mensaje de error para mejorar la experiencia del usuario
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === 'object') {
          // Formatear errores de validación
          errorMessage = Object.entries(error.response.data)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`;
              } else if (typeof messages === 'string') {
                return `${field}: ${messages}`;
              }
              return `${field}: Error de validación`;
            })
            .join('; ');
        }
        
        if (errorMessage) {
          console.error('Mensaje de error detallado:', errorMessage);
        }
      }
    } else if (error.request) {
      // La solicitud se realizó pero no se recibió respuesta
      console.error('API Error: No se recibió respuesta del servidor', {
        url: error.config?.url || 'unknown',
        method: error.config?.method || 'unknown'
      });
      
      // Sugerir posibles soluciones para problemas de conexión
      console.info('Posibles soluciones para problemas de conexión:');
      console.info('1. Verificar que el servidor backend esté en ejecución');
      console.info('2. Comprobar la configuración de CORS en el servidor');
      console.info('3. Verificar la conectividad de red');
    } else {
      // Error al configurar la solicitud
      console.error('API Error:', error.message);
    }
    
    // Para ciertos endpoints críticos, proporcionar respuestas fallback
    if (error.config?.url?.includes('/access/visitors/') && error.config.method === 'get') {
      console.warn('Usando respuesta fallback para visitantes debido a un error');
      return { data: [] };
    }
    
    return Promise.reject(error);
  }
);

// Función de ayuda para reintentar solicitudes fallidas
export const retryRequest = async (requestFn: () => Promise<any>, maxRetries = 3, delay = 1000) => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await requestFn();
    } catch (error) {
      retries++;
      if (retries === maxRetries) throw error;
      console.warn(`Reintentando solicitud fallida (intento ${retries}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export default apiClient;