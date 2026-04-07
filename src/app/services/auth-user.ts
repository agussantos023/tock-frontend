import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, Injector, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { catchError } from 'rxjs/operators';
import {
  AuthResponse,
  CheckAuthResponse,
  LoginRequest,
  MessageResponse,
  OtpResponse,
  RegisterRequest,
  RegistrationStatus,
} from '../shared/interface/auth.interface';
import { AuthStatus } from '../shared/interface/auth-status.type';
import { firstValueFrom, of } from 'rxjs';
import { UserData } from '../shared/interface/user.interface';
import { PlaybackManager } from './playback-manager';
import { Router } from '@angular/router';
import { NotificationManager } from './notification-manager';

@Injectable({
  providedIn: 'root',
})
export class AuthUser {
  private http = inject(HttpClient);
  private injector = inject(Injector);
  private router = inject(Router);
  private notificationManager = inject(NotificationManager);

  private apiUrl = `${environment.apiUrl}/auth`;

  #status = signal<AuthStatus>('checking');
  #userData = signal<UserData | null>(null);

  public status = this.#status.asReadonly();
  public userData = this.#userData.asReadonly();

  public userEmail = computed(() => this.#userData()?.email || null);

  public storagePercent = computed(() => {
    const data = this.userData();
    if (!data) return 0;

    const used = Number(data.storage_used);
    const limit = Number(data.storage_limit);

    if (limit === 0) return 0;

    const percent = (used / limit) * 100;
    return Math.min(percent, 100);
  });

  public storageStatusColor = computed(() => {
    const percent = this.storagePercent();
    if (percent >= 90) return '#ef4444'; // text-red-500
    if (percent >= 70) return '#f97316'; // text-orange-500
    return '#6366f1'; // text-indigo-500
  });

  constructor() {
    this.checkAuthStatus();
  }

  async login(credentials: LoginRequest) {
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials),
      );

      this.#status.set(res.status);

      this.#userData.set(res.user);
    } catch (err) {
      throw this.parseError(err);
    }
  }

  async register(userData: RegisterRequest) {
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData),
      );

      this.#status.set(res.status);

      this.#userData.set(res.user);
    } catch (err) {
      throw this.parseError(err);
    }
  }

  async getRegistrationStatus(): Promise<RegistrationStatus> {
    try {
      return await firstValueFrom(
        this.http.get<RegistrationStatus>(`${this.apiUrl}/registration-status`),
      );
    } catch (err) {
      return { available: false };
    }
  }

  async verifyEmail(code: string) {
    try {
      const res = await firstValueFrom(
        this.http.post<OtpResponse>(`${this.apiUrl}/verify-otp`, { otpCode: code }),
      );

      if (res.status) this.#status.set(res.status);
    } catch (err) {
      throw this.parseError(err);
    }
  }

  async resendCode() {
    try {
      const res = await firstValueFrom(
        this.http.post<OtpResponse>(`${this.apiUrl}/resend-otp`, {}),
      );

      this.notificationManager.show('Código enviado correctamente', 'success');
    } catch (err) {
      throw this.parseError(err);
    }
  }

  async logout() {
    const playback = this.injector.get(PlaybackManager);

    playback.eject();

    try {
      const res = await firstValueFrom(
        this.http.post<MessageResponse>(`${this.apiUrl}/logout`, {}),
      );

      if (res) console.log(res.message);
    } catch (err) {
      throw this.parseError(err);
    } finally {
      this.clearAuthData();
    }
  }

  async deleteAccount() {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/delete-account`));

      this.notificationManager.show('Cuenta eliminada permanentemente', 'info');
      this.clearAuthData();
    } catch (err) {
      throw this.parseError(err);
    }
  }

  checkAuthStatus(): void {
    this.http
      .post<CheckAuthResponse>(`${this.apiUrl}/validate-token`, {})
      .pipe(
        catchError(() => {
          this.clearAuthData(false);
          return of(null);
        }),
      )
      .subscribe((res) => {
        if (res) {
          this.#status.set(res.status);
          this.#userData.set(res.user);
        }
      });
  }

  updateStorage(newUsed: string, newLimit?: string) {
    this.#userData.update((data) => {
      if (!data) return null;

      return {
        ...data,
        storage_used: newUsed,
        ...(newLimit && { storage_limit: newLimit }),
      };
    });
  }

  // --- MÉTODOS PRIVADOS DE APOYO ---

  private clearAuthData(shouldNavigate: boolean = true) {
    this.#status.set('unauthenticated');
    this.#userData.set(null);

    if (shouldNavigate) {
      this.router.navigate(['/auth/login']);
    }
  }

  private parseError(err: any): string {
    const message = err.error?.error || err.error?.message || 'Error inesperado';

    if (err.status >= 500 || err.status === 0) {
      this.notificationManager.show('Error de conexión con el servidor', 'error');
    } else {
      this.notificationManager.show(message, 'error');
    }

    return message;
  }
}
