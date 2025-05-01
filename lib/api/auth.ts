import apiClient from './config';

// Definir interfaces para las respuestas de la API
export interface LoginResponse {
  access: string;
  refresh: string;
  user: UserResponse;
}

export interface UserResponse {
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

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    console.log("Intentando iniciar sesión:", { username });
    const response = await apiClient.post<LoginResponse>('/auth/login/', { username, password });
    console.log("Respuesta de login:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error en login:", error);
    throw error;
  }
};

export const register = async (userData: UserData): Promise<LoginResponse> => {
  try {
    console.log("Enviando datos de registro:", userData);
    const response = await apiClient.post<LoginResponse>('/auth/register/', userData);
    console.log("Respuesta de registro:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error en registro:", error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<UserResponse> => {
  const response = await apiClient.get<UserResponse>('/auth/me/');
  return response.data;
};

export const changePassword = async (data: PasswordData): Promise<{detail: string}> => {
  const response = await apiClient.post<{detail: string}>('/auth/change-password/', data);
  return response.data;
};

export const updateProfile = async (data: UserData): Promise<UserResponse> => {
  const response = await apiClient.patch<UserResponse>('/auth/me/', data);
  return response.data;
};

export const logout = async (): Promise<void> => {
  try {
    await apiClient.post<{detail: string}>('/auth/logout/');
  } catch (error) {
    console.error("Error en logout:", error);
  } finally {
    // Siempre limpiar el localStorage incluso si la API falla
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }
};

export const checkSession = async (): Promise<boolean> => {
  // Si no estamos en un navegador, no hay sesión
  if (typeof window === 'undefined') return false;
  
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
        
        const response = await apiClient.post<{access: string}>(`/auth/refresh/`, {
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
};