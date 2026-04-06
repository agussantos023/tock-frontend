import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthUser } from '../../../services/auth-user';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private authUser = inject(AuthUser);
  private router = inject(Router);

  errorMessage = signal<string | null>(null);
  isSubmitting = signal(false);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  async onSubmit() {
    if (this.loginForm.invalid) return;

    // Reset estado
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.getRawValue();

    try {
      await this.authUser.login({ email, password });
      console.log('iniciado');

      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      // 'error' es el string que devolvió parseError
      this.errorMessage.set('Usuario o contraseña incorrectos.');
      this.isSubmitting.set(false);
    }
  }
}
