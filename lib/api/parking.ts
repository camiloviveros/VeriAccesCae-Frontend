import apiClient from './config';
import { PaginatedResponse } from './types';

export interface ParkingAreaResponse {
  id: number;
  name: string;
  description?: string;
  max_capacity: number;
  current_count: number;
  is_active: boolean;
  available_spots: number;  // ACTUALIZADO: Ya no opcional
  vehicles_count?: number;
  [key: string]: any;
}

export interface VehicleResponse {
  id: number;
  user: number;
  user_detail?: {
    id: number;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  license_plate: string;
  brand: string;
  model: string;
  color: string;
  parking_area: number;  // NUEVO CAMPO OBLIGATORIO
  parking_area_detail?: {  // NUEVO CAMPO
    id: number;
    name: string;
    description?: string;
    max_capacity: number;
    current_count: number;
    available_spots: number;
  };
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface VehicleCreateData {
  license_plate: string;
  brand: string;
  model: string;
  color: string;
  parking_area: number;  // NUEVO CAMPO OBLIGATORIO
  user?: number; // Campo opcional, se agregará automáticamente si no se proporciona
}

export interface VehicleUpdateData {
  license_plate?: string;
  brand?: string;
  model?: string;
  color?: string;
  parking_area?: number;  // NUEVO CAMPO
  is_active?: boolean;
}

export interface ParkingAccessResponse {
  id: number;
  vehicle: number;
  vehicle_detail?: VehicleResponse;
  parking_area: number;
  parking_area_detail?: ParkingAreaResponse;
  valid_from: string;
  valid_to: string | null;
  is_active?: boolean;
  [key: string]: any;
}

export interface ParkingLogResponse {
  id: number;
  vehicle: number;
  vehicle_detail?: VehicleResponse;
  parking_area: number;
  parking_area_detail?: ParkingAreaResponse;
  timestamp: string;
  direction: 'in' | 'out';
  status: 'granted' | 'denied';
  reason?: string;
  [key: string]: any;
}

export interface ParkingStatsResponse {
  total_capacity: number;
  current_occupancy: number;
  available_spots: number;
  occupancy_percentage: number;
  areas: {
    id: number;
    name: string;
    capacity: number;
    occupied: number;
    available: number;
  }[];
}

// Funciones del servicio

// Vehículos
export const getVehicles = async (params?: Record<string, any>): Promise<VehicleResponse[] | PaginatedResponse<VehicleResponse>> => {
  try {
    const response = await apiClient.get<VehicleResponse[] | PaginatedResponse<VehicleResponse>>('/parking/vehicles/', { params });
    return response.data;
  } catch (error) {
    console.error("Error getting vehicles:", error);
    throw error;
  }
};

export const getVehicle = async (id: string | number): Promise<VehicleResponse> => {
  try {
    const response = await apiClient.get<VehicleResponse>(`/parking/vehicles/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error getting vehicle ${id}:`, error);
    throw error;
  }
};

export const createVehicle = async (data: VehicleCreateData): Promise<VehicleResponse> => {
  try {
    let vehicleData = { ...data };
    
    // Si no se proporciona user, obtenerlo del localStorage
    if (!vehicleData.user) {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('No se encontró información del usuario. Por favor, inicie sesión nuevamente.');
      }
      
      const user = JSON.parse(userStr);
      vehicleData.user = user.id;
    }
    
    console.log("Enviando datos del vehículo:", vehicleData);
    const response = await apiClient.post<VehicleResponse>('/parking/vehicles/', vehicleData);
    console.log("Respuesta del servidor:", response.data);
    
    // Disparar evento para actualizar otras partes de la aplicación
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('vehicleCreated'));
    }
    
    return response.data;
  } catch (error: unknown) {
    console.error("Error creating vehicle:", error);
    
    // Mejorar el manejo de errores
    const err = error as any;
    if (err.response?.data) {
      console.error("Error del servidor:", err.response.data);
      if (typeof err.response.data === 'object') {
        // Formatear errores de validación del backend
        const errorMessages = Object.entries(err.response.data)
          .map(([field, messages]) => {
            // Traducir nombres de campos
            const fieldNames: Record<string, string> = {
              license_plate: 'Placa',
              brand: 'Marca',
              model: 'Modelo',
              color: 'Color',
              parking_area: 'Área de Estacionamiento',  // NUEVO
              user: 'Usuario'
            };
            const fieldName = fieldNames[field] || field;
            
            if (Array.isArray(messages)) {
              return `${fieldName}: ${messages.join(', ')}`;
            }
            return `${fieldName}: ${messages}`;
          })
          .join('; ');
        throw new Error(errorMessages || 'Error al crear el vehículo');
      } else if (typeof err.response.data === 'string') {
        throw new Error(err.response.data);
      }
    }
    throw error;
  }
};

export const updateVehicle = async (id: string | number, data: VehicleUpdateData): Promise<VehicleResponse> => {
  try {
    console.log(`Actualizando vehículo ${id}:`, data);
    const response = await apiClient.patch<VehicleResponse>(`/parking/vehicles/${id}/`, data);
    
    // Disparar evento para actualizar otras partes de la aplicación
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('vehicleUpdated'));
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error updating vehicle ${id}:`, error);
    throw error;
  }
};

export const deleteVehicle = async (id: string | number): Promise<void> => {
  try {
    console.log(`Eliminando vehículo ${id}...`);
    await apiClient.delete(`/parking/vehicles/${id}/`);
    
    // Disparar evento para actualizar otras partes de la aplicación
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('vehicleDeleted'));
    }
    
    console.log(`Vehículo ${id} eliminado correctamente`);
  } catch (error) {
    console.error(`Error deleting vehicle ${id}:`, error);
    
    // Mejorar el manejo de errores
    const err = error as any;
    if (err.response?.data?.error) {
      throw new Error(err.response.data.error);
    } else if (err.response?.status === 403) {
      throw new Error('No tienes permisos para eliminar este vehículo');
    } else if (err.response?.status === 404) {
      throw new Error('El vehículo no fue encontrado');
    } else if (err.response?.status === 400) {
      throw new Error(err.response.data?.error || 'No se puede eliminar el vehículo');
    }
    
    throw error;
  }
};

// Áreas de estacionamiento
export const getParkingAreas = async (params?: Record<string, any>): Promise<ParkingAreaResponse[] | PaginatedResponse<ParkingAreaResponse>> => {
  try {
    const response = await apiClient.get<ParkingAreaResponse[] | PaginatedResponse<ParkingAreaResponse>>('/parking/areas/', { params });
    return response.data;
  } catch (error) {
    console.error("Error getting parking areas:", error);
    throw error;
  }
};

// NUEVA FUNCIÓN - Esta es la que faltaba
export const getAvailableParkingAreas = async (): Promise<ParkingAreaResponse[]> => {
  try {
    const response = await apiClient.get<ParkingAreaResponse[] | PaginatedResponse<ParkingAreaResponse>>('/parking/areas/', { 
      params: { active_only: 'true' } 
    });
    
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && 'results' in response.data) {
      return response.data.results;
    }
    
    return [];
  } catch (error) {
    console.error("Error getting available parking areas:", error);
    throw error;
  }
};

export const getParkingArea = async (id: string | number): Promise<ParkingAreaResponse> => {
  try {
    const response = await apiClient.get<ParkingAreaResponse>(`/parking/areas/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error getting parking area ${id}:`, error);
    throw error;
  }
};

export const createParkingArea = async (data: Partial<ParkingAreaResponse>): Promise<ParkingAreaResponse> => {
  try {
    const response = await apiClient.post<ParkingAreaResponse>('/parking/areas/', data);
    return response.data;
  } catch (error) {
    console.error("Error creating parking area:", error);
    throw error;
  }
};

export const updateParkingArea = async (id: string | number, data: Partial<ParkingAreaResponse>): Promise<ParkingAreaResponse> => {
  try {
    const response = await apiClient.patch<ParkingAreaResponse>(`/parking/areas/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating parking area ${id}:`, error);
    throw error;
  }
};

export const deleteParkingArea = async (id: string | number): Promise<void> => {
  try {
    await apiClient.delete(`/parking/areas/${id}/`);
  } catch (error) {
    console.error(`Error deleting parking area ${id}:`, error);
    throw error;
  }
};

// Logs de estacionamiento
export const getParkingLogs = async (params?: Record<string, any>): Promise<ParkingLogResponse[] | PaginatedResponse<ParkingLogResponse>> => {
  try { 
    const response = await apiClient.get<ParkingLogResponse[] | PaginatedResponse<ParkingLogResponse>>('/parking/logs/', { params });
    return response.data;
  } catch (error) {
    console.error("Error getting parking logs:", error);
    throw error;
  }
};

export const getParkingLog = async (id: string | number): Promise<ParkingLogResponse> => {
  try {
    const response = await apiClient.get<ParkingLogResponse>(`/parking/logs/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error getting parking log ${id}:`, error);
    throw error;
  }
};

// Acceso de estacionamiento
export const getParkingAccess = async (params?: Record<string, any>): Promise<ParkingAccessResponse[] | PaginatedResponse<ParkingAccessResponse>> => {
  try {
    const response = await apiClient.get<ParkingAccessResponse[] | PaginatedResponse<ParkingAccessResponse>>('/parking/access/', { params });
    return response.data;
  } catch (error) {
    console.error("Error getting parking access:", error);
    throw error;
  }
};

export const createParkingAccess = async (data: Partial<ParkingAccessResponse>): Promise<ParkingAccessResponse> => {
  try {
    const response = await apiClient.post<ParkingAccessResponse>('/parking/access/', data);
    return response.data;
  } catch (error) {
    console.error("Error creating parking access:", error);
    throw error;
  }
};

export const updateParkingAccess = async (id: string | number, data: Partial<ParkingAccessResponse>): Promise<ParkingAccessResponse> => {
  try {
    const response = await apiClient.patch<ParkingAccessResponse>(`/parking/access/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating parking access ${id}:`, error);
    throw error;
  }
};

export const deleteParkingAccess = async (id: string | number): Promise<void> => {
  try {
    await apiClient.delete(`/parking/access/${id}/`);
  } catch (error) {
    console.error(`Error deleting parking access ${id}:`, error);
    throw error;
  }
};

// Funciones de utilidad
export const checkVehicleAccess = async (vehicleId: string | number, areaId: string | number): Promise<boolean> => {
  try {
    const response = await apiClient.post<{has_access: boolean}>('/parking/check-access/', {
      vehicle: vehicleId,
      parking_area: areaId
    });
    return response.data.has_access;
  } catch (error) {
    console.error("Error checking vehicle access:", error);
    return false;
  }
};

export const getParkingStats = async (): Promise<ParkingStatsResponse> => {
  try {
    const response = await apiClient.get<ParkingStatsResponse>('/parking/areas/stats/');
    return response.data;
  } catch (error) {
    console.error("Error getting parking stats:", error);
    // Retornar valores por defecto en caso de error
    return {
      total_capacity: 0,
      current_occupancy: 0,
      available_spots: 0,
      occupancy_percentage: 0,
      areas: []
    };
  }
};

// Registrar entrada/salida
export const registerEntry = async (vehicleId: string | number, areaId: string | number): Promise<ParkingLogResponse> => {
  try {
    const response = await apiClient.post<ParkingLogResponse>('/parking/register-entry/', {
      vehicle: vehicleId,
      parking_area: areaId,
      direction: 'in'
    });
    return response.data;
  } catch (error) {
    console.error("Error registering entry:", error);
    throw error;
  }
};

export const registerExit = async (vehicleId: string | number, areaId: string | number): Promise<ParkingLogResponse> => {
  try {
    const response = await apiClient.post<ParkingLogResponse>('/parking/register-exit/', {
      vehicle: vehicleId,
      parking_area: areaId,
      direction: 'out'
    });
    return response.data;
  } catch (error) {
    console.error("Error registering exit:", error);
    throw error;
  }
};