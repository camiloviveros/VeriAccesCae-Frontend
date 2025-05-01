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
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de token expirado
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Verificar si error.config está definido
    const originalRequest = error.config 
      ? { ...error.config, _retry: error.config._retry || false } 
      : { _retry: false, url: null };
    
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
        
        const response = await axios.post<{access: string}>(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        
        // Guardar el nuevo token
        localStorage.setItem('access_token', response.data.access);
        
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
      switch (error.response.status) {
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
    } else if (error.request) {
      // La solicitud se realizó pero no se recibió respuesta
      console.error('API Error: No se recibió respuesta del servidor', {
        url: error.config?.url || 'unknown',
        method: error.config?.method || 'unknown'
      });
    } else {
      // Error al configurar la solicitud
      console.error('API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;