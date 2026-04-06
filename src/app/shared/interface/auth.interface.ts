import { AuthStatus } from './auth-status.type';
import { UserData } from './user.interface';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface CheckAuthResponse {
  status: AuthStatus;
  user: UserData;
}

export interface AuthResponse extends CheckAuthResponse {
  message: string;
}

export interface OtpResponse {
  message: string;
  status?: AuthStatus;
}

export interface MessageResponse {
  message: string;
}
