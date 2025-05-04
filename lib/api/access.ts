import apiClient from './config';
import { PaginatedResponse } from './types';

export interface AccessPointResponse {
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

export interface AccessZoneResponse {
  id: number;
  name: string;
  description?: string;
  access_points?: number[];
  max_capacity: number;
  current_count: number;
  [key: string]: any;
}

export interface AccessLogResponse {
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

export interface VisitorResponse {
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
  status?: 'pending' | 'inside' | 'outside' | 'denied';
  created_at: string;
  [key: string]: any;
}

export interface VisitorAccessResponse {
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

export interface VisitorAccessData {
  visitor: string | number;
  purpose?: string;
  valid_from?: string;
  valid_to?: string;
  access_zones?: number[];
  [key: string]: any;
}

export interface QRCodeResponse {
  qr_code_image: string;
}


export const getAccessPoints = async (): Promise<AccessPointResponse[] | PaginatedResponse<AccessPointResponse>> => {
  try {
    const response = await apiClient.get<AccessPointResponse[] | PaginatedResponse<AccessPointResponse>>('/access/access-points/');
    return response.data;
  } catch (error: unknown) {
    console.error("Error getting access points:", error);
    throw error;
  }
};

export const getAccessPoint = async (id: string | number): Promise<AccessPointResponse> => {
  try {
    const response = await apiClient.get<AccessPointResponse>(`/access/access-points/${id}/`);
    return response.data;
  } catch (error: unknown) {
    console.error(`Error getting access point ${id}:`, error);
    throw error;
  }
};

export const createAccessPoint = async (data: Partial<AccessPointResponse>): Promise<AccessPointResponse> => {
  try {
    console.log("Enviando datos para crear punto de acceso:", data);
    const response = await apiClient.post<AccessPointResponse>('/access/access-points/', data);
    return response.data;
  } catch (error: unknown) {
    console.error("Error creating access point:", error);
    throw error;
  }
};

export const updateAccessPoint = async (id: string | number, data: Partial<AccessPointResponse>): Promise<AccessPointResponse> => {
  try {
    console.log(`Actualizando punto de acceso ${id}:`, data);
    const response = await apiClient.patch<AccessPointResponse>(`/access/access-points/${id}/`, data);
    return response.data;
  } catch (error: unknown) {
    console.error(`Error updating access point ${id}:`, error);
    throw error;
  }
};

export const deleteAccessPoint = async (id: string | number): Promise<void> => {
  try {
    await apiClient.delete(`/access/access-points/${id}/`);
  } catch (error: unknown) {
    console.error(`Error deleting access point ${id}:`, error);
    throw error;
  }
};

export const getAccessZones = async (): Promise<AccessZoneResponse[] | PaginatedResponse<AccessZoneResponse>> => {
  try {
    const response = await apiClient.get<AccessZoneResponse[] | PaginatedResponse<AccessZoneResponse>>('/access/access-zones/');
    return response.data;
  } catch (error: unknown) {
    console.error("Error getting access zones:", error);
    throw error;
  }
};

export const getAccessLogs = async (params: Record<string, any> = {}): Promise<AccessLogResponse[] | PaginatedResponse<AccessLogResponse>> => {
  try {
    const response = await apiClient.get<PaginatedResponse<AccessLogResponse>>('/access/access-logs/', { params });
    return response.data;
  } catch (error: unknown) {
    console.error("Error getting access logs:", error);
    // Devolver un array vacío en caso de error para evitar errores en cascada
    return [];
  }
};

export const getVisitors = async (): Promise<VisitorResponse[] | PaginatedResponse<VisitorResponse>> => {
  try {
    const response = await apiClient.get<VisitorResponse[] | PaginatedResponse<VisitorResponse>>('/access/visitors/');
    
    // Check if response is valid before returning it
    if (response && response.data) {
      return response.data;
    } else {
      // If response is empty, return an empty array
      console.warn("Server response is empty");
      return [];
    }
  } catch (error: unknown) {
    console.error("Error getting visitors:", error);
    // Return an empty array in case of error to avoid cascading errors
    return [];
  }
};

export const createVisitor = async (data: FormData | Record<string, any>): Promise<VisitorResponse> => {
  try {
    // Ensure status field exists in the data
    if (data instanceof FormData) {
      if (!data.has('status')) {
        data.append('status', 'pending');
      }
    } else if (!('status' in data)) {
      data = { ...data, status: 'pending' };
    }

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
  } catch (error: unknown) {
    console.error("Error creating visitor:", error);
    
    // Create more informative error for potential database issues
    const err = error as any; // Usamos 'any' para evitar errores de TypeScript
    if (err?.response?.status === 500 && err?.config?.url?.includes('/access/visitors/')) {
      throw new Error('Error al crear visitante: Es posible que la base de datos necesite una migración para agregar campos necesarios como "status" al modelo Visitor');
    }
    
    throw error;
  }
};

export const updateVisitorStatus = async (id: string | number, status: string): Promise<VisitorResponse> => {
  try {
    console.log(`Updating visitor ${id} status to: ${status}`);
    
    // First try with dedicated endpoint
    try {
      const response = await apiClient.patch<VisitorResponse>(`/access/visitors/${id}/update_status/`, { status });
      console.log('Status update response:', response.data);
      
      // Disparar un evento para que el dashboard se actualice
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('visitorStatusChanged'));
      }
      
      return response.data;
    } catch (firstError: unknown) {
      console.log('Trying alternative route for status update');
      // If first attempt fails, try with standard update endpoint
      const response = await apiClient.patch<VisitorResponse>(`/access/visitors/${id}/`, { status });
      console.log('Status update response (alternative route):', response.data);
      
      // Disparar un evento para que el dashboard se actualice
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('visitorStatusChanged'));
      }
      
      return response.data;
    }
  } catch (error: unknown) {
    console.error(`Error updating visitor status (${id}):`, error);
    
    // Create a clearer error message
    const enhancedError = new Error('Error al actualizar estado del visitante. Verificar si la base de datos tiene el campo "status".');
    throw enhancedError;
  }
};

export const deleteVisitor = async (id: string | number): Promise<void> => {
  try {
    console.log(`Intentando eliminar visitante con ID: ${id}`);
    
    // Enviar solicitud DELETE al backend
    const response = await apiClient.delete(`/access/visitors/${id}/`);
    console.log(`Respuesta del backend al eliminar visitante ${id}:`, response.status);
    
    // Notificar a otros componentes sobre la eliminación exitosa
    if (typeof window !== 'undefined') {
      console.log(`Disparando evento visitorDeleted para el visitante ${id}`);
      window.dispatchEvent(new Event('visitorDeleted'));
      
      // Actualizar cualquier contador en localStorage si es necesario
      const visitorInsideCount = localStorage.getItem('visitorsInside');
      if (visitorInsideCount) {
        const currentCount = parseInt(visitorInsideCount, 10);
        if (!isNaN(currentCount) && currentCount > 0) {
          localStorage.setItem('visitorsInside', (currentCount - 1).toString());
        }
      }
    }
  } catch (error: unknown) {
    console.error(`Error detallado al eliminar visitante (${id}):`, error);
    
    // Analizar el error para proporcionar información útil
    const err = error as any;
    
    // Si es un error 404, simplemente registrarlo pero no lanzar excepción
    // (el visitante ya podría haber sido eliminado)
    if (err?.response?.status === 404) {
      console.warn(`Visitante con ID ${id} no encontrado o ya fue eliminado`);
      // Aún así disparamos el evento para actualizar la UI
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('visitorDeleted'));
      }
      return; // No lanzamos excepción
    }
    
    // Para errores reales, preparar un mensaje detallado
    let errorMessage = `Error al eliminar visitante ${id}`;
    
    if (err?.response?.status === 403) {
      errorMessage = 'No tiene permisos para eliminar este visitante';
    } else if (err?.response?.status === 500) {
      errorMessage = 'Error del servidor al intentar eliminar el visitante';
    } else if (err?.response?.data) {
      if (typeof err.response.data === 'string') {
        errorMessage = err.response.data;
      } else if (typeof err.response.data === 'object') {
        errorMessage = JSON.stringify(err.response.data);
      }
    } else if (err?.message) {
      errorMessage = err.message;
    }
    
    // Crear un nuevo error con mensaje mejorado
    const enhancedError = new Error(errorMessage);
    
    // Añadir detalles para depuración
    (enhancedError as any).originalError = error;
    (enhancedError as any).visitorId = id;
    (enhancedError as any).timestamp = new Date().toISOString();
    
    throw enhancedError;
  }
};

export const getOccupancyStats = async (): Promise<{current: number, max: number}> => {
  try {
    // Esto podría ser un endpoint específico en tu backend
    const response = await apiClient.get<{current: number, max: number}>('/access/stats/occupancy/');
    return response.data;
  } catch (error: unknown) {
    console.error('Error getting occupancy stats:', error);
    // Devolver datos predeterminados en caso de error
    return { current: 0, max: 100 };
  }
};

export const createVisitorAccess = async (data: VisitorAccessData): Promise<VisitorAccessResponse> => {
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
  } catch (error: unknown) {
    console.error("Error creating visitor access:", error);
    const err = error as any; // Usamos 'any' para evitar errores de TypeScript
    throw error;
  }
};

export const getQRCode = async (id: string | number): Promise<QRCodeResponse> => {
  try {
    const response = await apiClient.get<QRCodeResponse>(`/access/visitor-access/${id}/qr_image/`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error getting QR code:", error);
    throw error;
  }
};

export const remoteControl = async (id: string | number, action: 'lock' | 'unlock'): Promise<{detail: string}> => {
  try {
    const response = await apiClient.post<{detail: string}>(`/access/access-points/${id}/remote_control/`, { action });
    return response.data;
  } catch (error: unknown) {
    console.error(`Error in remote control (${action}):`, error);
    throw error;
  }
};