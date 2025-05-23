
import apiClient from './config';
import { PaginatedResponse } from './types';

export interface ParkingAreaResponse {
  id: number;
  name: string;
  description?: string;
  max_capacity: number;
  current_count: number;
  is_active: boolean;
  [key: string]: any;
}

export interface VehicleResponse {
  id: number;
  user: number;
  license_plate: string;
  brand: string;
  model: string;
  color: string;
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
}

export interface ParkingAccessResponse {
  id: number;
  vehicle: number;
  parking_area: number;
  valid_from: string;
  valid_to: string | null;
  [key: string]: any;
}

export interface ParkingLogResponse {
  id: number;
  vehicle: number;
  parking_area: number;
  timestamp: string;
  direction: 'in' | 'out';
  status: 'granted' | 'denied';
  reason?: string;
  [key: string]: any;
}

// Funciones del servicio
export const getVehicles = async (): Promise<VehicleResponse[] | PaginatedResponse<VehicleResponse>> => {
  try {
    const response = await apiClient.get<VehicleResponse[] | PaginatedResponse<VehicleResponse>>('/parking/vehicles/');
    return response.data;
  } catch (error) {
    console.error("Error getting vehicles:", error);
    throw error;
  }
};

export const createVehicle = async (data: VehicleCreateData): Promise<VehicleResponse> => {
  try {
    console.log("Enviando datos del vehículo:", data);
    const response = await apiClient.post<VehicleResponse>('/parking/vehicles/', data);
    console.log("Respuesta del servidor:", response.data);
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
            if (Array.isArray(messages)) {
              return `${field}: ${messages.join(', ')}`;
            }
            return `${field}: ${messages}`;
          })
          .join('; ');
        throw new Error(errorMessages);
      }
    }
    throw error;
  }
};

export const updateVehicle = async (id: string | number, data: Partial<VehicleResponse>): Promise<VehicleResponse> => {
  try {
    const response = await apiClient.patch<VehicleResponse>(`/parking/vehicles/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating vehicle ${id}:`, error);
    throw error;
  }
};

export const deleteVehicle = async (id: string | number): Promise<void> => {
  try {
    await apiClient.delete(`/parking/vehicles/${id}/`);
  } catch (error) {
    console.error(`Error deleting vehicle ${id}:`, error);
    throw error;
  }
};

export const getParkingAreas = async (): Promise<ParkingAreaResponse[] | PaginatedResponse<ParkingAreaResponse>> => {
  try {
    const response = await apiClient.get<ParkingAreaResponse[] | PaginatedResponse<ParkingAreaResponse>>('/parking/areas/');
    return response.data;
  } catch (error) {
    console.error("Error getting parking areas:", error);
    throw error;
  }
};

export const getParkingLogs = async (): Promise<ParkingLogResponse[] | PaginatedResponse<ParkingLogResponse>> => {
  try { 
    const response = await apiClient.get<ParkingLogResponse[] | PaginatedResponse<ParkingLogResponse>>('/parking/logs/');
    return response.data;
  } catch (error) {
    console.error("Error getting parking logs:", error);
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