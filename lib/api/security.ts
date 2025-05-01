import apiClient from './config';
import { PaginatedResponse } from './types';

export interface IncidentResponse {
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

export interface IncidentCommentResponse {
  id: number;
  incident: number;
  user: number;
  comment: string;
  created_at: string;
  is_system_comment: boolean;
  [key: string]: any;
}

export interface EmergencyProtocolResponse {
  id: number;
  name: string;
  description: string;
  instructions: string;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface EmergencyEventResponse {
  id: number;
  protocol: number;
  activated_by: number;
  timestamp: string;
  ended_at?: string;
  notes?: string;
  affected_zones: number[];
  [key: string]: any;
}

export interface SecurityRoundResponse {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  created_at: string;
  is_active: boolean;
  estimated_duration: number;
  [key: string]: any;
}


export interface IncidentData {
  title: string;
  description: string;
  location: string;
  severity: string;
  [key: string]: any;
}

export const getIncidents = async (): Promise<IncidentResponse[] | PaginatedResponse<IncidentResponse>> => {
  try {
    const response = await apiClient.get<IncidentResponse[] | PaginatedResponse<IncidentResponse>>('/security/incidents/');
    return response.data;
  } catch (error) {
    console.error("Error getting incidents:", error);
    throw error;
  }
};

export const getIncident = async (id: string | number): Promise<IncidentResponse> => {
  try {
    const response = await apiClient.get<IncidentResponse>(`/security/incidents/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error getting incident ${id}:`, error);
    throw error;
  }
};

export const createIncident = async (data: IncidentData): Promise<IncidentResponse> => {
  try {
    const response = await apiClient.post<IncidentResponse>('/security/incidents/', data);
    return response.data;
  } catch (error) {
    console.error("Error creating incident:", error);
    throw error;
  }
};

export const updateIncident = async (id: string | number, data: Partial<IncidentResponse>): Promise<IncidentResponse> => {
  try {
    const response = await apiClient.patch<IncidentResponse>(`/security/incidents/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating incident ${id}:`, error);
    throw error;
  }
};

export const addIncidentComment = async (incidentId: string | number, comment: string): Promise<IncidentCommentResponse> => {
  try {
    const response = await apiClient.post<IncidentCommentResponse>(`/security/incidents/${incidentId}/comments/`, {
      comment,
      is_system_comment: false
    });
    return response.data;
  } catch (error) {
    console.error(`Error adding comment to incident ${incidentId}:`, error);
    throw error;
  }
};

export const getProtocols = async (): Promise<EmergencyProtocolResponse[] | PaginatedResponse<EmergencyProtocolResponse>> => {
  try {
    const response = await apiClient.get<EmergencyProtocolResponse[] | PaginatedResponse<EmergencyProtocolResponse>>('/security/protocols/');
    return response.data;
  } catch (error) {
    console.error("Error getting emergency protocols:", error);
    throw error;
  }
};

export const activateProtocol = async (protocolId: string | number, affectedZones: number[] = []): Promise<EmergencyEventResponse> => {
  try {
    const response = await apiClient.post<EmergencyEventResponse>('/security/events/', {
      protocol: protocolId,
      affected_zones: affectedZones
    });
    return response.data;
  } catch (error) {
    console.error(`Error activating protocol ${protocolId}:`, error);
    throw error;
  }
};

export const endEmergency = async (eventId: string | number, notes?: string): Promise<EmergencyEventResponse> => {
  try {
    const response = await apiClient.patch<EmergencyEventResponse>(`/security/events/${eventId}/`, {
      ended_at: new Date().toISOString(),
      notes
    });
    return response.data;
  } catch (error) {
    console.error(`Error ending emergency event ${eventId}:`, error);
    throw error;
  }
};

export const getRounds = async (): Promise<SecurityRoundResponse[] | PaginatedResponse<SecurityRoundResponse>> => {
  try {
    const response = await apiClient.get<SecurityRoundResponse[] | PaginatedResponse<SecurityRoundResponse>>('/security/rounds/');
    return response.data;
  } catch (error) {
    console.error("Error getting security rounds:", error);
    throw error;
  }
};

export const startRound = async (roundId: string | number): Promise<any> => {
  try {
    const response = await apiClient.post('/security/executions/', {
      round: roundId
    });
    return response.data;
  } catch (error) {
    console.error(`Error starting round ${roundId}:`, error);
    throw error;
  }
};

export const completeRound = async (executionId: string | number): Promise<any> => {
  try {
    const response = await apiClient.post(`/security/executions/${executionId}/complete/`, {});
    return response.data;
  } catch (error) {
    console.error(`Error completing round execution ${executionId}:`, error);
    throw error;
  }
};