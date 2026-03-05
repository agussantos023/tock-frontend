export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token?: string;
  message: string;
  isVerified: boolean;
  user?: {
    id: number;
    email: string;
    storage_limit: string;
  };
}
