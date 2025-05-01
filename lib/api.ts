import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Definir interfaces para las respuestas de la API
interface LoginResponse {
  access: string;
  refresh: string;
  user: UserResponse;
}

interface UserResponse {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_active?: boolean;
  is_staff?: boolean;
  role?: {
    id: number;
    name: string;
  };
  [key: string]: any;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface AccessPointResponse {
  id: number;
  name: string;
  description?: string;
  location: string;
  is_active: boolean;
  max_capacity: number;
  current_count: number;
  created_at: string;
  [key: string]: any;
}

interface AccessZoneResponse {
  id: number;
  name: string;
  description?: string;
  access_points?: number[];
  max_capacity: number;
  current_count: number;
  [key: string]: any;
}

interface AccessLogResponse {
  id: number;
  user?: number;
  user_detail?: {
    id: number;
    username: string;
    full_name?: string;
  };
  access_point: number;
  access_point_detail?: {
    id: number;
    name: string;
    location: string;
  };
  card_id?: string;
  timestamp: string;
  status: 'granted' | 'denied';
  reason?: string;
  direction: 'in' | 'out';
  [key: string]: any;
}

interface VisitorResponse {
  id: number;
  first_name: string;
  last_name: string;
  id_number: string;
  phone?: string;
  email?: string;
  company?: string;
  photo?: string;
  visitor_type?: string;
  apartment_number?: string;
  entry_date?: string;
  exit_date?: string;
  status?: string;
  created_at: string;
  [key: string]: any;
}

interface VisitorAccessResponse {
  id: number;
  visitor: number;
  visitor_detail?: {
    id: number;
    name: string;
    id_number: string;
    company?: string;
  };
  host: number;
  host_detail?: {
    id: number;
    username: string;
    full_name?: string;
  };
  purpose: string;
  valid_from: string;
  valid_to: string;
  access_zones: number[];
  access_zones_detail?: {
    id: number;
    name: string;
  }[];
  qr_code: string;
  is_used: boolean;
  created_at: string;
  [key: string]: any;
}

interface QRCodeResponse {
  qr_code_image: string;
}

interface IncidentResponse {
  id: number;
  title: string;
  description: string;
  location: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  reported_by: number;
  assigned_to?: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  [key: string]: any;
}

interface RoundResponse {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  created_at: string;
  is_active: boolean;
  estimated_duration: number;
  [key: string]: any;
}

interface ReportDefinitionResponse {
  id: number;
  name: string;
  description?: string;
  report_type: string;
  period: string;
  filters: Record<string, any>;
  created_by: number;
  created_at: string;
  [key: string]: any;
}

interface GeneratedReportResponse {
  id: number;
  report: number;
  file: string;
  format: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  generated_by: number;
  [key: string]: any;
}

interface NotificationResponse {
  id: number;
  title: string;
  message: string;
  notification_type: 'email' | 'push' | 'sms' | 'in_app';
  read: boolean;
  created_at: string;
  recipient: number;
  [key: string]: any;
}

interface NotificationPreferenceResponse {
  id: number;
  user: number;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  [key: string]: any;
}

interface VehicleResponse {
  id: number;
  user: number;
  license_plate: string;
  brand: string;
  model: string;
  color: string;
  is_active: boolean;
  [key: string]: any;
}

interface ParkingAreaResponse {
  id: number;
  name: string;
  description?: string;
  max_capacity: number;
  current_count: number;
  is_active: boolean;
  [key: string]: any;
}

interface ParkingLogResponse {
  id: number;
  vehicle: number;
  parking_area: number;
  timestamp: string;
  direction: 'in' | 'out';
  status: 'granted' | 'denied';
  reason?: string;
  [key: string]: any;
}

// Variable para verificar si estamos en el navegador
const isBrowser = typeof window !== 'undefined';

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

// Definición de tipos para los parámetros de los servicios
interface LoginData {
  username: string;
  password: string;
}

interface UserData {
  username?: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  [key: string]: any;
}

interface PasswordData {
  current_password: string;
  new_password: string;
  confirm_password?: string;
}

interface VisitorAccessData {
  visitor: string | number;
  purpose?: string;
  valid_from?: string;
  valid_to?: string;
  access_zones?: number[];
  [key: string]: any;
}

interface IncidentData {
  title: string;
  description: string;
  location: string;
  severity: string;
  [key: string]: any;
}

interface ReportParams {
  report: number;
  period_start?: string;
  period_end?: string;
  format?: string;
  [key: string]: any;
}

// Servicios API para cada entidad
export const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    try {
      console.log("Intentando iniciar sesión:", { username });
      const response = await apiClient.post<LoginResponse>('/auth/login/', { username, password });
      console.log("Respuesta de login:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    }
  },
  
  register: async (userData: UserData): Promise<LoginResponse> => {
    try {
      console.log("Enviando datos de registro:", userData);
      const response = await apiClient.post<LoginResponse>('/auth/register/', userData);
      console.log("Respuesta de registro:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error en registro:", error);
      throw error;
    }
  },
  
  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>('/auth/me/');
    return response.data;
  },
  
  changePassword: async (data: PasswordData): Promise<{detail: string}> => {
    const response = await apiClient.post<{detail: string}>('/auth/change-password/', data);
    return response.data;
  },
  
  updateProfile: async (data: UserData): Promise<UserResponse> => {
    const response = await apiClient.patch<UserResponse>('/auth/me/', data);
    return response.data;
  },
  
  logout: async (): Promise<void> => {
    try {
      await apiClient.post<{detail: string}>('/auth/logout/');
    } catch (error) {
      console.error("Error en logout:", error);
    } finally {
      // Siempre limpiar el localStorage incluso si la API falla
      if (isBrowser) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
    }
  },
  
  checkSession: async (): Promise<boolean> => {
    // Si no estamos en un navegador, no hay sesión
    if (!isBrowser) return false;
    
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    
    try {
      // Intentar hacer una solicitud para verificar que el token es válido
      await apiClient.get('/auth/me/');
      return true;
    } catch (error) {
      // Si hay un error, la sesión probablemente expiró
      console.error("Session check failed:", error);
      
      // Verificar si el error es 401 (Unauthorized)
      const axiosError = error as any;
      if (axiosError.response?.status === 401) {
        try {
          // Intentar refrescar el token
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) {
            return false;
          }
          
          const response = await axios.post<{access: string}>(`${API_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          
          // Guardar el nuevo token
          localStorage.setItem('access_token', response.data.access);
          
          // Intentar nuevamente la solicitud
          await apiClient.get('/auth/me/');
          return true;
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          // Limpiar tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          return false;
        }
      }
      
      return false;
    }
  }
};

export const accessService = {
  getAccessPoints: async (): Promise<AccessPointResponse[] | PaginatedResponse<AccessPointResponse>> => {
    try {
      const response = await apiClient.get<AccessPointResponse[] | PaginatedResponse<AccessPointResponse>>('/access/access-points/');
      return response.data;
    } catch (error) {
      console.error("Error getting access points:", error);
      throw error;
    }
  },
  
  getAccessPoint: async (id: string | number): Promise<AccessPointResponse> => {
    try {
      const response = await apiClient.get<AccessPointResponse>(`/access/access-points/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error getting access point ${id}:`, error);
      throw error;
    }
  },
  
  createAccessPoint: async (data: Partial<AccessPointResponse>): Promise<AccessPointResponse> => {
    try {
      console.log("Enviando datos para crear punto de acceso:", data);
      const response = await apiClient.post<AccessPointResponse>('/access/access-points/', data);
      return response.data;
    } catch (error) {
      console.error("Error creating access point:", error);
      throw error;
    }
  },
  
  updateAccessPoint: async (id: string | number, data: Partial<AccessPointResponse>): Promise<AccessPointResponse> => {
    try {
      console.log(`Actualizando punto de acceso ${id}:`, data);
      const response = await apiClient.patch<AccessPointResponse>(`/access/access-points/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating access point ${id}:`, error);
      throw error;
    }
  },
  
  deleteAccessPoint: async (id: string | number): Promise<void> => {
    try {
      await apiClient.delete(`/access/access-points/${id}/`);
    } catch (error) {
      console.error(`Error deleting access point ${id}:`, error);
      throw error;
    }
  },
  
  getAccessZones: async (): Promise<AccessZoneResponse[] | PaginatedResponse<AccessZoneResponse>> => {
    try {
      const response = await apiClient.get<AccessZoneResponse[] | PaginatedResponse<AccessZoneResponse>>('/access/access-zones/');
      return response.data;
    } catch (error) {
      console.error("Error getting access zones:", error);
      throw error;
    }
  },
  
  getAccessLogs: async (params: Record<string, any> = {}): Promise<PaginatedResponse<AccessLogResponse>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<AccessLogResponse>>('/access/access-logs/', { params });
      return response.data;
    } catch (error) {
      console.error("Error getting access logs:", error);
      throw error;
    }
  },
  
  getVisitors: async (): Promise<VisitorResponse[] | PaginatedResponse<VisitorResponse>> => {
    try {
      const response = await apiClient.get<VisitorResponse[] | PaginatedResponse<VisitorResponse>>('/access/visitors/');
      return response.data;
    } catch (error) {
      console.error("Error getting visitors:", error);
      throw error;
    }
  },
  
  createVisitor: async (data: FormData | Record<string, any>): Promise<VisitorResponse> => {
    try {
      // Si los datos ya son FormData, usarlos directamente
      if (data instanceof FormData) {
        const response = await apiClient.post<VisitorResponse>('/access/visitors/', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
      }
      
      // Si no, crear FormData
      const formData = new FormData();
      
      // Añadir cada campo al FormData
      Object.entries(data).forEach(([key, value]) => {
        // Si es un arreglo
        if (Array.isArray(value)) {
          value.forEach(item => {
            formData.append(`${key}`, item.toString());
          });
        } 
        // Si es un archivo (como photo)
        else if (value instanceof File) {
          formData.append(key, value);
        } 
        // Para otros tipos de datos
        else if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      
      // Enviar FormData
      const response = await apiClient.post<VisitorResponse>('/access/visitors/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return response.data;
    } catch (error) {
      console.error("Error creating visitor:", error);
      throw error;
    }
  },
  
  // Añadir método para actualizar el estado de un visitante
  updateVisitorStatus: async (id: string | number, status: string): Promise<VisitorResponse> => {
    try {
      const response = await apiClient.patch<VisitorResponse>(`/access/visitors/${id}/`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating visitor status (${id}):`, error);
      throw error;
    }
  },

  // Añadir método para eliminar un visitante
  deleteVisitor: async (id: string | number): Promise<void> => {
    try {
      await apiClient.delete(`/access/visitors/${id}/`);
    } catch (error) {
      console.error(`Error deleting visitor (${id}):`, error);
      throw error;
    }
  },
  
  // Añadir método para obtener estadísticas
  getOccupancyStats: async (): Promise<{current: number, max: number}> => {
    try {
      // Esto podría ser un endpoint específico en tu backend
      const response = await apiClient.get<{current: number, max: number}>('/access/stats/occupancy/');
      return response.data;
    } catch (error) {
      console.error('Error getting occupancy stats:', error);
      throw error;
    }
  },
  
  createVisitorAccess: async (data: VisitorAccessData): Promise<VisitorAccessResponse> => {
    try {
      // Si los datos ya son FormData, usarlos directamente
      if (data instanceof FormData) {
        const response = await apiClient.post<VisitorAccessResponse>('/access/visitor-access/', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
      }
      
      // Si no, crear FormData
      const formData = new FormData();
      
      // Añadir cada campo al FormData
      Object.entries(data).forEach(([key, value]) => {
        // Si es un arreglo (como access_zones)
        if (Array.isArray(value)) {
          value.forEach(item => {
            formData.append(`${key}`, item.toString());
          });
        } 
        // Si es un archivo (como photo)
        else if (value instanceof File) {
          formData.append(key, value);
        } 
        // Para otros tipos de datos
        else if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      
      // Enviar FormData
      const response = await apiClient.post<VisitorAccessResponse>('/access/visitor-access/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return response.data;
    } catch (error) {
      console.error("Error creating visitor access:", error);
      throw error;
    }
  },
  
  getQRCode: async (id: string | number): Promise<QRCodeResponse> => {
    try {
      const response = await apiClient.get<QRCodeResponse>(`/access/visitor-access/${id}/qr_image/`);
      return response.data;
    } catch (error) {
      console.error("Error getting QR code:", error);
      throw error;
    }
  },
  
  remoteControl: async (id: string | number, action: 'lock' | 'unlock'): Promise<{detail: string}> => {
    try {
      const response = await apiClient.post<{detail: string}>(`/access/access-points/${id}/remote_control/`, { action });
      return response.data;
    } catch (error) {
      console.error(`Error in remote control (${action}):`, error);
      throw error;
    }
  }
};

export const securityService = {
  getIncidents: async (): Promise<IncidentResponse[] | PaginatedResponse<IncidentResponse>> => {
    try {
      const response = await apiClient.get<IncidentResponse[] | PaginatedResponse<IncidentResponse>>('/security/incidents/');
      return response.data;
    } catch (error) {
      console.error("Error getting incidents:", error);
      throw error;
    }
  },
  
  createIncident: async (data: IncidentData): Promise<IncidentResponse> => {
    try {
      const response = await apiClient.post<IncidentResponse>('/security/incidents/', data);
      return response.data;
    } catch (error) {
      console.error("Error creating incident:", error);
      throw error;
    }
  },
  
  getRounds: async (): Promise<RoundResponse[] | PaginatedResponse<RoundResponse>> => {
    try {
      const response = await apiClient.get<RoundResponse[] | PaginatedResponse<RoundResponse>>('/security/rounds/');
      return response.data;
    } catch (error) {
      console.error("Error getting security rounds:", error);
      throw error;
    }
  },
};

export const reportService = {
  getReports: async (): Promise<ReportDefinitionResponse[] | PaginatedResponse<ReportDefinitionResponse>> => {
    try {
      const response = await apiClient.get<ReportDefinitionResponse[] | PaginatedResponse<ReportDefinitionResponse>>('/reports/definitions/');
      return response.data;
    } catch (error) {
      console.error("Error getting reports:", error);
      throw error;
    }
  },
  
  generateReport: async (reportId: string | number, params: Omit<ReportParams, 'report'>): Promise<GeneratedReportResponse> => {
    try {
      const response = await apiClient.post<GeneratedReportResponse>('/reports/generated/', {
        report: reportId,
        ...params
      });
      return response.data;
    } catch (error) {
      console.error("Error generating report:", error);
      throw error;
    }
  },
};

// Servicio para notificaciones
export const notificationService = {
  getNotifications: async (): Promise<NotificationResponse[] | PaginatedResponse<NotificationResponse>> => {
    try {
      const response = await apiClient.get<NotificationResponse[] | PaginatedResponse<NotificationResponse>>('/notifications/messages/');
      return response.data;
    } catch (error) {
      console.error("Error getting notifications:", error);
      throw error;
    }
  },
  
  markAsRead: async (id: string | number): Promise<NotificationResponse> => {
    try {
      const response = await apiClient.patch<NotificationResponse>(`/notifications/messages/${id}/`, {
        read: true
      });
      return response.data;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },
  
  getPreferences: async (): Promise<NotificationPreferenceResponse> => {
    try {
      const response = await apiClient.get<PaginatedResponse<NotificationPreferenceResponse> | NotificationPreferenceResponse[]>('/notifications/preferences/');
      
      // Manejar diferentes formatos de respuesta
      if ('results' in response.data && Array.isArray(response.data.results)) {
        return response.data.results[0];
      } else if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0];
      }
      
      throw new Error('No se encontraron preferencias de notificación');
    } catch (error) {
      console.error("Error getting notification preferences:", error);
      throw error;
    }
  },
  
  updatePreferences: async (data: Partial<NotificationPreferenceResponse>): Promise<NotificationPreferenceResponse> => {
    try {
      const prefs = await notificationService.getPreferences();
      const response = await apiClient.patch<NotificationPreferenceResponse>(`/notifications/preferences/${prefs.id}/`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      throw error;
    }
  }
};

// Servicio para vehículos
export const parkingService = {
  getVehicles: async (): Promise<VehicleResponse[] | PaginatedResponse<VehicleResponse>> => {
    try {
      const response = await apiClient.get<VehicleResponse[] | PaginatedResponse<VehicleResponse>>('/parking/vehicles/');
      return response.data;
    } catch (error) {
      console.error("Error getting vehicles:", error);
      throw error;
    }
  },
  
  createVehicle: async (data: Partial<VehicleResponse>): Promise<VehicleResponse> => {
    try {
      const response = await apiClient.post<VehicleResponse>('/parking/vehicles/', data);
      return response.data;
    } catch (error) {
      console.error("Error creating vehicle:", error);
      throw error;
    }
  },
  
  getParkingAreas: async (): Promise<ParkingAreaResponse[] | PaginatedResponse<ParkingAreaResponse>> => {
    try {
      const response = await apiClient.get<ParkingAreaResponse[] | PaginatedResponse<ParkingAreaResponse>>('/parking/areas/');
      return response.data;
    } catch (error) {
      console.error("Error getting parking areas:", error);
      throw error;
    }
  },
  
  getParkingLogs: async (): Promise<ParkingLogResponse[] | PaginatedResponse<ParkingLogResponse>> => {
    try { 
      const response = await apiClient.get<ParkingLogResponse[] | PaginatedResponse<ParkingLogResponse>>('/parking/logs/');
      return response.data;
    } catch (error) {
      console.error("Error getting parking logs:", error);
      throw error;
    }
  }
};

export default apiClient;