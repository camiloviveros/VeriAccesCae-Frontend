import apiClient from './config';
import { PaginatedResponse } from './types';

export * from './types';
export { default as apiClient } from './config';
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
  [key: string]: any;
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

export const getVehicles = async (): Promise<VehicleResponse[] | PaginatedResponse<VehicleResponse>> => {
  try {
    const response = await apiClient.get<VehicleResponse[] | PaginatedResponse<VehicleResponse>>('/parking/vehicles/');
    return response.data;
  } catch (error) {
    console.error("Error getting vehicles:", error);
    throw error;
  }
};

export const createVehicle = async (data: Partial<VehicleResponse>): Promise<VehicleResponse> => {
  try {
    const response = await apiClient.post<VehicleResponse>('/parking/vehicles/', data);
    return response.data;
  } catch (error) {
    console.error("Error creating vehicle:", error);
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