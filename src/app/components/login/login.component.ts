import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { UserService, LoginDto, ApiResponse, LoginResult } from '../../service/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loginForm: FormGroup;
  isSubmitting = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private spinnerService: NgxSpinnerService,
    private toastr: ToastrService,
    private userService: UserService
  ) {
    this.loginForm = this.createForm();
  }

  ngOnInit(): void {
    console.log('Login Component initialized');
    // Check if user is already logged in
    this.checkExistingAuth();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],
      rememberMe: [false]
    });
  }

  // Form control getters
  get username(): AbstractControl | null { return this.loginForm.get('username'); }
  get password(): AbstractControl | null { return this.loginForm.get('password'); }
  get rememberMe(): AbstractControl | null { return this.loginForm.get('rememberMe'); }

  // Form validation helpers
  hasError(control: AbstractControl | null): boolean {
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldClasses(control: AbstractControl | null): string {
    const baseClasses = 'form-control';
    if (this.hasError(control)) {
      return `${baseClasses} is-invalid`;
    }
    if (control && control.valid && (control.dirty || control.touched)) {
      return `${baseClasses} is-valid`;
    }
    return baseClasses;
  }

  getErrorMessage(control: AbstractControl | null, fieldName: string): string {
    if (!control || !control.errors) return '';

    const errors = control.errors;
    if (errors['required']) {
      return `${fieldName} is required`;
    }
    if (errors['minlength']) {
      return `${fieldName} must be at least ${errors['minlength'].requiredLength} characters`;
    }
    if (errors['maxlength']) {
      return `${fieldName} must not exceed ${errors['maxlength'].requiredLength} characters`;
    }
    return `${fieldName} is invalid`;
  }

  // Password visibility toggle
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Form submission
  onSubmit(): void {
    if (this.loginForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.spinnerService.show();

      const loginData: LoginDto = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password
      };

      this.userService.loginUser(loginData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: ApiResponse<LoginResult>) => {
            if (response.success && response.data) {
              
              // Store authentication data
              this.storeAuthData(response.data, this.loginForm.value.rememberMe);
              
              // Show success message
              this.toastr.success('Login successful!', 'Welcome back!');
              
              // Navigate to dashboard or return URL
              const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
              this.router.navigate([returnUrl]);
            } else {
              this.toastr.error(response.message || 'Login failed', 'Authentication Error');
            }
            this.spinnerService.hide();
            this.isSubmitting = false;
          },
          error: (error) => {
            this.toastr.error(
              error.message || 'An error occurred during login. Please try again.',
              'Login Error'
            );
            this.spinnerService.hide();
            this.isSubmitting = false;
          }
        });
    } else {
      this.markFormGroupTouched();
      this.toastr.warning('Please fill in all required fields correctly.', 'Form Validation');
    }
  }

  // Store authentication data
  private storeAuthData(loginResult: LoginResult, rememberMe: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem('auth_token', loginResult.token);
    storage.setItem('refresh_token', loginResult.refreshToken);
    storage.setItem('user_data', JSON.stringify(loginResult.user));
    storage.setItem('token_expires_at', loginResult.expiresAt.toString());
    
    // Also store in session storage for immediate access
    if (rememberMe) {
      sessionStorage.setItem('auth_token', loginResult.token);
      sessionStorage.setItem('user_data', JSON.stringify(loginResult.user));
    }
  }

  // Check existing authentication
  private checkExistingAuth(): void {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
      // Check if token is still valid
      const expiresAt = localStorage.getItem('token_expires_at') || sessionStorage.getItem('token_expires_at');
      if (expiresAt && new Date(expiresAt) > new Date()) {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigate([returnUrl]);
      } else {
        // Token expired, clear storage
        this.clearAuthData();
      }
    }
  }

  // Clear authentication data
  private clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('token_expires_at');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_data');
  }

  // Mark all form controls as touched
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // Navigate to register page
  onRegister(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/register']);
  }

  // Handle forgot password
  onForgotPassword(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/password-reset']);
  }

  // Demo login methods
  loginAsAdmin(): void {
    this.loginForm.patchValue({
      username: 'admin',
      password: 'admin123'
    });
  }

  loginAsUser(): void {
    this.loginForm.patchValue({
      username: 'user',
      password: 'user123'
    });
  }


}
