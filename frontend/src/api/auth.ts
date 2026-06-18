import apiClient from './client';
import type { ApiResponse } from '../types/index';
import type { AuthResponse, LoginPayload, RegisterPayload, PublicUser } from '../types/auth.types';

export async function loginApi(payload: LoginPayload): Promise<ApiResponse<AuthResponse>> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', payload);
  return response.data;
}

export async function registerApi(payload: RegisterPayload): Promise<ApiResponse<AuthResponse>> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', payload);
  return response.data;
}

export async function getMeApi(): Promise<ApiResponse<{ user: PublicUser }>> {
  const response = await apiClient.get<ApiResponse<{ user: PublicUser }>>('/auth/me');
  return response.data;
}

export async function logoutApi(refreshToken: string): Promise<ApiResponse<null>> {
  const response = await apiClient.post<ApiResponse<null>>('/auth/logout', { refreshToken });
  return response.data;
}
