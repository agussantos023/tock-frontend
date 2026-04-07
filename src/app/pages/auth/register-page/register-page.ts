import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthUser } from '../../../services/auth-user';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.html',
  styleUrl: './register-page.css',
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private authUser = inject(AuthUser);
  private router = inject(Router);

  errorMessage = signal<string | null>(null);
  isSubmitting = signal(false);
  isRegisterAvailable = signal<boolean>(true);
  isLoadingStatus = signal(true);

  constructor() {
    this.checkStatus();
  }

  registerForm: FormGroup = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: this.passwordMatchValidator,
    },
  );

  get f() {
    return this.registerForm.controls;
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    return password && confirmPassword && password.value !== confirmPassword.value
      ? { passwordMismatch: true }
      : null;
  }

  async checkStatus() {
    const status = await this.authUser.getRegistrationStatus();

    this.isRegisterAvailable.set(status.available);
    this.isLoadingStatus.set(false);
  }

  async onSubmit() {
    if (this.registerForm.invalid) return;

    // Reset estado
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.registerForm.getRawValue();

    try {
      await this.authUser.register({ email, password });

      this.router.navigate(['/auth/verify-email']);
    } catch (err: any) {
      const msg = err || 'Error al registrar cuenta.';

      this.errorMessage.set(msg);
      this.isSubmitting.set(false);
    }
  }
}
