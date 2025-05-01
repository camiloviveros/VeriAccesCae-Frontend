import apiClient from './config';
import { PaginatedResponse } from './types';

export interface NotificationResponse {
  id: number;
  title: string;
  message: string;
  notification_type: 'email' | 'push' | 'sms' | 'in_app';
  read: boolean;
  created_at: string;
  recipient: number;
  [key: string]: any;
}

export interface NotificationPreferenceResponse {
  id: number;
  user: number;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  [key: string]: any;
}


export const getNotifications = async (): Promise<NotificationResponse[] | PaginatedResponse<NotificationResponse>> => {
  try {
    const response = await apiClient.get<NotificationResponse[] | PaginatedResponse<NotificationResponse>>('/notifications/messages/');
    return response.data;
  } catch (error) {
    console.error("Error getting notifications:", error);
    throw error;
  }
};

export const markAsRead = async (id: string | number): Promise<NotificationResponse> => {
  try {
    const response = await apiClient.patch<NotificationResponse>(`/notifications/messages/${id}/`, {
      read: true
    });
    return response.data;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

export const getPreferences = async (): Promise<NotificationPreferenceResponse> => {
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
};

export const updatePreferences = async (data: Partial<NotificationPreferenceResponse>): Promise<NotificationPreferenceResponse> => {
  try {
    const prefs = await getPreferences();
    const response = await apiClient.patch<NotificationPreferenceResponse>(`/notifications/preferences/${prefs.id}/`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    throw error;
  }
};