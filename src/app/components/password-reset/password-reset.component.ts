import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { PasswordResetService, ForgotPasswordRequest, ResetPasswordRequest, ValidateTokenRequest } from '../../service/password-reset.service';

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.css']
})
export class PasswordResetComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentStep: 'forgot' | 'reset' | 'success' = 'forgot';
  isSubmitting = false;
  showNewPassword = false;
  showConfirmPassword = false;

  forgotPasswordForm: FormGroup;
  resetPasswordForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private passwordResetService: PasswordResetService
  ) {
    this.forgotPasswordForm = this.createForgotPasswordForm();
    this.resetPasswordForm = this.createResetPasswordForm();
  }

  ngOnInit(): void {
    // Check if we have a token in the URL or route params
    const token = this.route.snapshot.queryParams['token'];
    if (token) {
      this.resetPasswordForm.patchValue({ token });
      this.currentStep = 'reset';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForgotPasswordForm(): FormGroup {
    return this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email
      ]]
    });
  }

  private createResetPasswordForm(): FormGroup {
    return this.fb.group({
      token: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }

    return null;
  }

  // Password strength checker
  getPasswordStrength(): { strength: string; color: string; percentage: number } {
    const password = this.resetPasswordForm.get('newPassword')?.value || '';
    let score = 0;
    let feedback = '';

    if (password.length >= 8) score += 25;
    if (/[a-z]/.test(password)) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[@$!%*?&]/.test(password)) score += 25;

    if (score >= 100) {
      feedback = 'Strong';
      return { strength: feedback, color: 'success', percentage: 100 };
    } else if (score >= 75) {
      feedback = 'Good';
      return { strength: feedback, color: 'info', percentage: 75 };
    } else if (score >= 50) {
      feedback = 'Fair';
      return { strength: feedback, color: 'warning', percentage: 50 };
    } else {
      feedback = 'Weak';
      return { strength: feedback, color: 'danger', percentage: 25 };
    }
  }

  // Toggle password visibility
  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Forgot password submission
  onForgotPassword(): void {
    if (this.forgotPasswordForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const request: ForgotPasswordRequest = {
        email: this.forgotPasswordForm.value.email
      };

      this.passwordResetService.forgotPassword(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.toastr.success('Password reset token generated successfully!', 'Success');
              console.log('Reset Token:', response.resetToken);
              console.log('Expires At:', response.expiresAt);
              
              // In a real application, you would show the token to the user
              // or automatically proceed to the reset step
              this.toastr.info(`Reset Token: ${response.resetToken}`, 'Copy this token', {
                timeOut: 10000,
                extendedTimeOut: 5000
              });
              
              // Auto-fill the token in reset form and switch to reset step
              this.resetPasswordForm.patchValue({ token: response.resetToken });
              this.currentStep = 'reset';
            } else {
              this.toastr.error('Failed to generate reset token', 'Error');
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error generating reset token:', error);
            this.toastr.error(
              error.error?.message || 'An error occurred. Please try again.',
              'Error'
            );
            this.isSubmitting = false;
          }
        });
    } else {
      this.markFormGroupTouched(this.forgotPasswordForm);
      this.toastr.warning('Please enter a valid email address.', 'Form Validation');
    }
  }

  // Reset password submission
  onResetPassword(): void {
    if (this.resetPasswordForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const request: ResetPasswordRequest = {
        token: this.resetPasswordForm.value.token,
        newPassword: this.resetPasswordForm.value.newPassword,
        confirmPassword: this.resetPasswordForm.value.confirmPassword
      };

      this.passwordResetService.resetPassword(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.toastr.success('Password has been reset successfully!', 'Success');
              this.currentStep = 'success';
            } else {
              this.toastr.error('Failed to reset password', 'Error');
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error resetting password:', error);
            this.toastr.error(
              error.error?.message || 'An error occurred. Please try again.',
              'Error'
            );
            this.isSubmitting = false;
          }
        });
    } else {
      this.markFormGroupTouched(this.resetPasswordForm);
      this.toastr.warning('Please fill in all required fields correctly.', 'Form Validation');
    }
  }

  // Validate token
  validateToken(): void {
    const token = this.resetPasswordForm.get('token')?.value;
    if (!token) {
      this.toastr.warning('Please enter a reset token first.', 'Validation');
      return;
    }

    const request: ValidateTokenRequest = { token };

    this.passwordResetService.validateToken(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data.isValid) {
            this.toastr.success('Reset token is valid!', 'Token Valid');
            console.log('Token expires at:', response.data.expiresAt);
          } else {
            this.toastr.error('Reset token is invalid or expired.', 'Token Invalid');
          }
        },
        error: (error) => {
          console.error('Error validating token:', error);
          this.toastr.error(
            error.error?.message || 'Failed to validate token.',
            'Error'
          );
        }
      });
  }

  // Mark all form controls as touched to trigger validation display
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Get validation error message
  getErrorMessage(control: AbstractControl | null, fieldName: string): string {
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;
    
    if (errors['required']) {
      return `${fieldName} is required`;
    }
    
    if (errors['email']) {
      return 'Please enter a valid email address';
    }
    
    if (errors['minlength']) {
      return `${fieldName} must be at least ${errors['minlength'].requiredLength} characters`;
    }
    
    if (errors['pattern']) {
      if (fieldName === 'New Password') {
        return 'Password must contain uppercase, lowercase, number, and special character';
      }
    }

    if (errors['passwordMismatch']) {
      return 'Passwords do not match';
    }

    return `${fieldName} is invalid`;
  }

  // Check if field has error
  hasError(control: AbstractControl | null): boolean {
    return !!(control && control.errors && control.touched);
  }

  // Get field CSS classes
  getFieldClasses(control: AbstractControl | null): string {
    if (this.hasError(control)) {
      return 'form-control is-invalid';
    }
    if (control?.valid && control?.touched) {
      return 'form-control is-valid';
    }
    return 'form-control';
  }

  // Navigation methods
  goBack(): void {
    this.router.navigate(['/login']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}





