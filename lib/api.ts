import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Cliente axios con configuración base
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token a las solicitudes
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de token expirado
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = {
      ...error.config,
      _retry: error.config?._retry || false
    };
    
    // Si el error es 401 y no es un reintento
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Intentar refrescar el token
        const refreshToken = localStorage.getItem('refresh_token');
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
        // Si falla el refresh, redirigir al login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Definición de tipos para los servicios
interface LoginData {
  username: string;
  password: string;
}

interface UserData {
  [key: string]: any;
}

interface PasswordData {
  [key: string]: any;
}

interface VisitorAccessData {
  [key: string]: any;
}

interface IncidentData {
  [key: string]: any;
}

interface ReportParams {
  [key: string]: any;
}

// Servicios API para cada entidad
export const authService = {
  login: async (username: string, password: string) => {
    const response = await apiClient.post<{token: string}>('/auth/login/', { username, password });
    return response.data;
  },
  register: async (userData: UserData) => {
    const response = await apiClient.post('/auth/register/', userData);
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me/');
    return response.data;
  },
  changePassword: async (data: PasswordData) => {
    const response = await apiClient.post('/auth/change-password/', data);
    return response.data;
  },
};

export const accessService = {
  getAccessPoints: async () => {
    const response = await apiClient.get('/access/access-points/');
    return response.data;
  },
  getAccessZones: async () => {
    const response = await apiClient.get('/access/access-zones/');
    return response.data;
  },
  getAccessLogs: async (params: Record<string, any> = {}) => {
    const response = await apiClient.get('/access/access-logs/', { params });
    return response.data;
  },
  getVisitors: async () => {
    const response = await apiClient.get('/access/visitors/');
    return response.data;
  },
  createVisitorAccess: async (data: VisitorAccessData) => {
    const response = await apiClient.post('/access/visitor-access/', data);
    return response.data;
  },
  getQRCode: async (id: string | number) => {
    const response = await apiClient.get(`/access/visitor-access/${id}/qr_image/`);
    return response.data;
  },
};

export const securityService = {
  getIncidents: async () => {
    const response = await apiClient.get('/security/incidents/');
    return response.data;
  },
  createIncident: async (data: IncidentData) => {
    const response = await apiClient.post('/security/incidents/', data);
    return response.data;
  },
  getRounds: async () => {
    const response = await apiClient.get('/security/rounds/');
    return response.data;
  },
};

export const reportService = {
  getReports: async () => {
    const response = await apiClient.get('/reports/definitions/');
    return response.data;
  },
  generateReport: async (reportId: string | number, params: ReportParams) => {
    const response = await apiClient.post(`/reports/generated/`, {
      report: reportId,
      ...params
    });
    return response.data;
  },
};

export default apiClient;