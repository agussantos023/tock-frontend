import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';
import { AuthResponse, LoginRequest, RegisterRequest } from '../interface/auth.interface';
import { AuthStatus } from '../interface/auth-status.type';
import { OtpResponse } from '../interface/otp-response.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthUser {
  private http = inject(HttpClient);
  private cookieService = inject(CookieService);
  private apiUrl = `${environment.apiUrl}/auth`;

  #status = signal<AuthStatus>('checking');

  public status = this.#status.asReadonly();

  constructor() {
    this.checkAuthStatus();
  }

  login(credentials: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response.token) {
          this.cookieService.set('token', response.token, { path: '/' });
          this.#status.set(response.isVerified ? 'authenticated' : 'unverified');
        } else {
          console.error(response.message);
        }
      }),
    );
  }

  register(userData: RegisterRequest) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap((response) => {
        if (response.token) {
          this.cookieService.set('token', response.token, { path: '/' });
          this.#status.set('unverified');
        } else {
          console.error(response.message);
        }
      }),
    );
  }

  verifyEmail(code: string) {
    return this.http.post<OtpResponse>(`${this.apiUrl}/verify-otp`, { otpCode: code }).pipe(
      tap(() => {
        this.#status.set('authenticated');
      }),
    );
  }

  resendCode() {
    return this.http.post<OtpResponse>(`${this.apiUrl}/resend-otp`, {});
  }

  checkAuthStatus(): void {
    if (!this.cookieService.check('token')) {
      this.#status.set('unauthenticated');
      return;
    }

    this.http.post<{ status: AuthStatus }>(`${this.apiUrl}/validate-token`, {}).subscribe({
      next: (res) => {
        if (res) this.#status.set(res.status);
        else this.#status.set('unauthenticated');
      },
      error: (err) => {
        console.error(err);
        this.#status.set('unauthenticated');
      },
    });
  }

  logout() {
    this.cookieService.delete('token', '/');
    this.#status.set('unauthenticated');
  }

  getToken() {
    return this.cookieService.get('token');
  }
}
