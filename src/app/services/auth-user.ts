import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { catchError, tap } from 'rxjs/operators';
import { AuthResponse, LoginRequest, RegisterRequest } from '../shared/interface/auth.interface';
import { AuthStatus } from '../shared/interface/auth-status.type';
import { OtpResponse } from '../shared/interface/otp-response.interface';
import { of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthUser {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  #status = signal<AuthStatus>('checking');
  public status = this.#status.asReadonly();

  constructor() {
    this.checkAuthStatus();
  }

  /**
   * Helper para centralizar la captura de errores
   */
  private handleError(err: any) {
    const message = err.error?.error || err.error?.message || 'Error inesperado en el servidor';

    if (err.status >= 500) {
      console.error('🔥 Error Crítico del Servidor:', message);
    }
    return throwError(() => message);
  }

  login(credentials: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        this.#status.set(res.isVerified ? 'authenticated' : 'unverified');
      }),
      catchError(this.handleError),
    );
  }

  register(userData: RegisterRequest) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(() => this.#status.set('unverified')),
      catchError(this.handleError),
    );
  }

  verifyEmail(code: string) {
    return this.http.post<OtpResponse>(`${this.apiUrl}/verify-otp`, { otpCode: code }).pipe(
      tap(() => this.#status.set('authenticated')),
      catchError(this.handleError),
    );
  }

  resendCode() {
    return this.http
      .post<OtpResponse>(`${this.apiUrl}/resend-otp`, {})
      .pipe(catchError(this.handleError));
  }

  checkAuthStatus(): void {
    this.http
      .post<{ status: AuthStatus }>(`${this.apiUrl}/validate-token`, {})
      .pipe(
        catchError(() => {
          this.#status.set('unauthenticated');
          return of(null);
        }),
      )
      .subscribe((res) => {
        if (res) this.#status.set(res.status);
      });
  }

  logout() {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => {
        this.#status.set('unauthenticated');
        window.location.reload();
      },
      error: () => {
        this.#status.set('unauthenticated');
        window.location.reload();
      },
    });
  }
}
