import { apiClient } from '@/shared/api';

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    user_id: number;
    email: string;
    full_name: string | null;
  };
}

export async function loginApi(body: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>('/auth/login', body);
  return res.data;
}
