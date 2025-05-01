import { jwtDecode } from 'jwt-decode';

interface JwtToken {
  exp: number;
  user_id: number;
  [key: string]: any;
}

// Actualizada la interfaz User para incluir todas las propiedades necesarias
interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string; // Añadida la propiedad phone
  is_staff?: boolean;
  is_superuser?: boolean;
  is_active?: boolean;
  date_joined?: string;
  last_login?: string;
  role?: {
    id: number;
    name: string;
  };
  [key: string]: any; // Para permitir propiedades adicionales
}

/**
 * Retrieves the access token from localStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

/**
 * Retrieves the refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}

/**
 * Stores the access and refresh tokens in localStorage
 */
export function setTokens(access: string, refresh: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

/**
 * Removes the tokens from localStorage
 */
export function removeTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

/**
 * Checks if the current user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  
  try {
    const decoded = jwtDecode<JwtToken>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
}

/**
 * Retrieves the current user from localStorage
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as User;
  } catch (error) {
    return null;
  }
}

/**
 * Stores the user in localStorage
 */
export function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Checks if the current user has a specific role
 */
export function hasRole(roleName: string): boolean {
  const user = getCurrentUser();
  if (!user || !user.role) return false;
  return user.role.name === roleName;
}

/**
 * Checks if the current user is an admin
 */
export function isAdmin(): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return user.is_staff || user.is_superuser || hasRole('Administrator');
}

/**
 * Logs out the user by removing tokens and user data
 */
export function logout(): void {
  removeTokens();
}