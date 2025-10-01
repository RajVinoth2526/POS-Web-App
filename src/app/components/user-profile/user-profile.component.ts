import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { UserService, User, UserUpdateDto } from '../../service/user.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  profileForm: FormGroup;
  currentUser: User | null = null;
  isSubmitting = false;
  originalFormData: any = {};

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
    private toastr: ToastrService,
    private userService: UserService
  ) {
    this.profileForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
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
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      phone: ['', [
        Validators.pattern(/^[\+]?[\d\s\-\(\)]{7,20}$/)
      ]],
      department: ['']
    });
  }

  private loadCurrentUser(): void {
    const userData = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
    
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
        this.populateForm();
        console.log('User Profile: Loaded current user:', this.currentUser?.username);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.toastr.error('Error loading user data', 'Error');
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.toastr.error('No user data found', 'Error');
      this.router.navigate(['/dashboard']);
    }
  }

  private populateForm(): void {
    if (this.currentUser) {
      const formData = {
        firstName: this.currentUser.firstName || '',
        lastName: this.currentUser.lastName || '',
        email: this.currentUser.email || '',
        phone: this.currentUser.phoneNumber || '',
        department: this.currentUser.department || ''
      };

      this.profileForm.patchValue(formData);
      this.originalFormData = { ...formData };
    }
  }

  // Check if form has changes
  hasChanges(): boolean {
    if (!this.originalFormData) return false;
    
    const currentData = this.profileForm.value;
    return Object.keys(this.originalFormData).some(key => 
      currentData[key] !== this.originalFormData[key]
    );
  }

  // Form submission
  onSubmit(): void {
    if (this.profileForm.valid && !this.isSubmitting && this.hasChanges()) {
      this.isSubmitting = true;

      const updateData: UserUpdateDto = {
        firstName: this.profileForm.value.firstName,
        lastName: this.profileForm.value.lastName,
        email: this.profileForm.value.email,
        phoneNumber: this.profileForm.value.phone?.trim() || null,
        department: this.profileForm.value.department?.trim() || null
      };

      console.log('Profile Update Data:', updateData);
      console.log('Form Values:', this.profileForm.value);

      if (this.currentUser?.id) {
        this.userService.updateUser(this.currentUser.id, updateData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              if (response.success && response.data) {
                // Update local storage with new user data
                this.updateLocalUserData(response.data);
                
                this.toastr.success('Profile updated successfully!', 'Success');
                this.originalFormData = { ...this.profileForm.value };
              } else {
                this.toastr.error(response.message || 'Failed to update profile', 'Error');
              }
              this.isSubmitting = false;
            },
            error: (error) => {
              console.error('Error updating profile:', error);
              this.toastr.error(
                error.error?.message || 'An error occurred. Please try again.',
                'Error'
              );
              this.isSubmitting = false;
            }
          });
      } else {
        this.toastr.error('User ID not found', 'Error');
        this.isSubmitting = false;
      }
    } else if (!this.hasChanges()) {
      this.toastr.info('No changes to save', 'Information');
    } else {
      this.markFormGroupTouched();
      this.toastr.warning('Please fill in all required fields correctly.', 'Form Validation');
    }
  }

  private updateLocalUserData(updatedUser: User): void {
    // Update current user object
    this.currentUser = updatedUser;
    
    // Update localStorage
    const userData = localStorage.getItem('user_data');
    const sessionData = sessionStorage.getItem('user_data');
    
    if (userData) {
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
    if (sessionData) {
      sessionStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  }

  // Reset form to original values
  onReset(): void {
    this.profileForm.patchValue(this.originalFormData);
    this.toastr.info('Form reset to original values', 'Reset');
  }

  // Mark all form controls as touched to trigger validation display
  private markFormGroupTouched(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
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
    
    if (errors['maxlength']) {
      return `${fieldName} must not exceed ${errors['maxlength'].requiredLength} characters`;
    }
    
    if (errors['pattern']) {
      if (fieldName === 'First Name' || fieldName === 'Last Name') {
        return `${fieldName} can only contain letters and spaces`;
      }
      if (fieldName === 'Phone') {
        return 'Please enter a valid phone number (7-20 digits, +, -, (), spaces allowed)';
      }
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
    this.router.navigate(['/dashboard']);
  }
}
