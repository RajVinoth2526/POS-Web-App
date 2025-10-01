import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { UserService, RegisterDto, ApiResponse, User } from '../../service/user.service';

export interface UserFormData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  role: string;
  department: string;
  phone: string;
  isActive: boolean;
}

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  userForm: FormGroup;
  isSubmitting = false;
  showPassword = false;
  showConfirmPassword = false;
  isRegistrationMode = false;

  // Available options
  roles = [
    { value: 'admin', label: 'Admin', description: 'Full system access' },
    { value: 'manager', label: 'Manager', description: 'Department management access' },
    { value: 'user', label: 'User', description: 'Standard user access' },
    { value: 'cashier', label: 'Cashier', description: 'Sales and transaction access' }
  ];

  departments = [
    { value: 'Sales', label: 'Sales' },
    { value: 'Inventory', label: 'Inventory' },
    { value: 'Finance', label: 'Finance' },
    { value: 'HR', label: 'Human Resources' },
    { value: 'IT', label: 'Information Technology' },
    { value: 'Operations', label: 'Operations' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private spinnerService: NgxSpinnerService,
    private toastr: ToastrService,
    private userService: UserService
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit(): void {
    console.log('Add User Component initialized');
    // Check if we're in registration mode
    this.isRegistrationMode = this.router.url.includes('/register');
    console.log('Registration mode:', this.isRegistrationMode);
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
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\s]+$/)
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\s]+$/)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      ]],
      confirmPassword: ['', [
        Validators.required
      ]],
      role: ['user', [Validators.required]],
      department: ['', [Validators.required]],
      phone: ['', [
        Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)
      ]],
      isActive: [true],
      agreeTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }

    return null;
  }

  // Form getters for easy access in template
  get username() { return this.userForm.get('username'); }
  get email() { return this.userForm.get('email'); }
  get firstName() { return this.userForm.get('firstName'); }
  get lastName() { return this.userForm.get('lastName'); }
  get password() { return this.userForm.get('password'); }
  get confirmPassword() { return this.userForm.get('confirmPassword'); }
  get role() { return this.userForm.get('role'); }
  get department() { return this.userForm.get('department'); }
  get phone() { return this.userForm.get('phone'); }
  get agreeTerms() { return this.userForm.get('agreeTerms'); }

  // Password strength checker
  getPasswordStrength(): { strength: string; color: string; percentage: number } {
    const password = this.password?.value || '';
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
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Form submission
  onSubmit(): void {
    if (this.userForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.spinnerService.show();

      const formData: UserFormData = this.userForm.value;
      console.log('Submitting user data:', formData);

      // Prepare data for API
      const registerData: RegisterDto = {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role,
        department: formData.department,
        phoneNumber: formData.phone || undefined,
        isActive: formData.isActive
      };

      this.userService.registerUser(registerData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: ApiResponse<User>) => {
            if (response.success) {
              console.log('User created successfully:', response.data);
              if (this.isRegistrationMode) {
                this.toastr.success('Account created successfully!', 'Registration Complete');
                setTimeout(() => {
                  this.router.navigate(['/login']);
                }, 2000);
              } else {
                this.toastr.success('User created successfully!', 'Success');
                setTimeout(() => {
                  this.router.navigate(['/users']);
                }, 2000);
              }
            } else {
              console.error('Failed to create user:', response.message);
              this.toastr.error(response.message || 'Failed to create user', 'Error');
            }
            this.spinnerService.hide();
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error creating user:', error);
            this.toastr.error(
              error.message || 'An error occurred. Please try again.',
              'Error'
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

  // Mark all form controls as touched to trigger validation display
  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  // Reset form
  onReset(): void {
    this.userForm.reset({
      role: 'user',
      isActive: true,
      agreeTerms: false
    });
    this.showPassword = false;
    this.showConfirmPassword = false;
  }

  // Cancel and go back
  onCancel(): void {
    if (this.isRegistrationMode) {
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/users']);
    }
  }

  // Show success message
  private showSuccessMessage(): void {
    // You can implement toast notification here
    console.log('User created successfully!');
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
    
    if (errors['maxlength']) {
      return `${fieldName} must not exceed ${errors['maxlength'].requiredLength} characters`;
    }
    
    if (errors['pattern']) {
      if (fieldName === 'Username') {
        return 'Username can only contain letters, numbers, and underscores';
      }
      if (fieldName === 'First Name' || fieldName === 'Last Name') {
        return `${fieldName} can only contain letters and spaces`;
      }
      if (fieldName === 'Phone') {
        return 'Please enter a valid phone number';
      }
    }

    if (errors['passwordMismatch']) {
      return 'Passwords do not match';
    }

    if (errors['requiredTrue']) {
      return 'You must agree to the terms and conditions';
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
}
