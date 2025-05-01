import apiClient from './config';
import { PaginatedResponse } from './types';

export interface ReportDefinitionResponse {
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

export interface GeneratedReportResponse {
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

export interface ReportScheduleResponse {
  id: number;
  report: number;
  is_active: boolean;
  run_daily: boolean;
  run_weekly: boolean;
  day_of_week?: number;
  run_monthly: boolean;
  day_of_month?: number;
  run_time: string;
  created_by: number;
  created_at: string;
  [key: string]: any;
}


export interface ReportParams {
  report: number;
  period_start?: string;
  period_end?: string;
  format?: string;
  [key: string]: any;
}

export const getReports = async (): Promise<ReportDefinitionResponse[] | PaginatedResponse<ReportDefinitionResponse>> => {
  try {
    const response = await apiClient.get<ReportDefinitionResponse[] | PaginatedResponse<ReportDefinitionResponse>>('/reports/definitions/');
    return response.data;
  } catch (error) {
    console.error("Error getting reports:", error);
    throw error;
  }
};

export const getReport = async (id: string | number): Promise<ReportDefinitionResponse> => {
  try {
    const response = await apiClient.get<ReportDefinitionResponse>(`/reports/definitions/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error getting report ${id}:`, error);
    throw error;
  }
};

export const createReport = async (data: Partial<ReportDefinitionResponse>): Promise<ReportDefinitionResponse> => {
  try {
    const response = await apiClient.post<ReportDefinitionResponse>('/reports/definitions/', data);
    return response.data;
  } catch (error) {
    console.error("Error creating report:", error);
    throw error;
  }
};

export const generateReport = async (reportId: string | number, params: Omit<ReportParams, 'report'>): Promise<GeneratedReportResponse> => {
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
};

export const getGeneratedReports = async (reportId?: string | number): Promise<GeneratedReportResponse[] | PaginatedResponse<GeneratedReportResponse>> => {
  try {
    const params = reportId ? { report: reportId } : {};
    const response = await apiClient.get<GeneratedReportResponse[] | PaginatedResponse<GeneratedReportResponse>>('/reports/generated/', { params });
    return response.data;
  } catch (error) {
    console.error("Error getting generated reports:", error);
    throw error;
  }
};

export const getReportSchedules = async (reportId?: string | number): Promise<ReportScheduleResponse[] | PaginatedResponse<ReportScheduleResponse>> => {
  try {
    const params = reportId ? { report: reportId } : {};
    const response = await apiClient.get<ReportScheduleResponse[] | PaginatedResponse<ReportScheduleResponse>>('/reports/schedules/', { params });
    return response.data;
  } catch (error) {
    console.error("Error getting report schedules:", error);
    throw error;
  }
};

export const createReportSchedule = async (data: Partial<ReportScheduleResponse>): Promise<ReportScheduleResponse> => {
  try {
    const response = await apiClient.post<ReportScheduleResponse>('/reports/schedules/', data);
    return response.data;
  } catch (error) {
    console.error("Error creating report schedule:", error);
    throw error;
  }
};