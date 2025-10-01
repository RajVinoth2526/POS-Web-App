import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SystemService } from '../../service/system.service';
import { environment } from 'src/environments/environment';
import { Profile, ThemeSettings } from '../../model/system.model';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, OnDestroy  {
  themeForm!: FormGroup;
  themeId: number | null = null;
  businessForm!: FormGroup;
  private subscriptions: Subscription[] = [];
  
  // New properties for enhanced functionality
  activeTab: string = 'profile';
  isThemePreviewEnabled: boolean = true;
  
  constructor(
    private fb: FormBuilder,
    private systemSettings: SystemService,
    private spinnerService: NgxSpinnerService,
    private tosterService: ToastrService,
    
  ) {
    // Initialize activeTab to 'profile' by default
    this.activeTab = 'profile';
    
    this.themeForm = this.fb.group({
      primaryColor: [environment.defaultThemeSettings.primaryColor],
      secondaryColor: [environment.defaultThemeSettings.secondaryColor],
      backgroundColor: [environment.defaultThemeSettings.backgroundColor],
      fontStyle: [environment.defaultThemeSettings.fontStyle]
    });
  }


  ngOnInit(): void {

    const themeSettingsSubscribe = this.systemSettings.themeSettings$.subscribe((data: ThemeSettings | null) => {
      if(data == null) return;
      this.themeForm = this.fb.group({
        primaryColor: [data.primaryColor],
        secondaryColor: [data.secondaryColor],
        backgroundColor: [data.backgroundColor],
        fontStyle: [data.fontStyle]
      });
      
      // Add live preview listener
      this.themeForm.valueChanges.subscribe(() => {
        if (this.isThemePreviewEnabled) {
          this.applyThemePreview();
        }
      });
    });

    const profileSubscribe = this.systemSettings.profile$.subscribe((data: Profile | null) => {
      if(data != null) {
        this.businessForm = this.fb.group({
          businessName: [ data.businessName, Validators.required],
          ownerName: [data.ownerName, Validators.required],
          phoneNumber: [data.phoneNumber, Validators.required],
          email: [data.email, [Validators.required, Validators.email]],
        });
      } else {
        this.businessForm = this.fb.group({
          businessName: ['', Validators.required],
          ownerName: ['', Validators.required],
          phoneNumber: ['', Validators.required],
          email: ['', [Validators.required, Validators.email]],
        });
      }
    });

    this.subscriptions.push(profileSubscribe, themeSettingsSubscribe);
   
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Reset to system theme when leaving settings
    if (this.isThemePreviewEnabled) {
      const currentTheme = this.systemSettings.getCurrentThemeSettingsValue();
      if (currentTheme) {
        this.applyThemeValue(currentTheme);
      }
    }
  }

  onProfileSubmit() {
    const profile = this.businessForm.value;
    const currentProfile = this.systemSettings.getProfileValue();
    if (this.businessForm.valid) {
      if (currentProfile && currentProfile.id) {
        // Update the theme settings
        this.spinnerService.show();
        this.systemSettings.updateProfile(currentProfile.id, profile).subscribe((response: any) => {
          if (response.success) {
            this.spinnerService.hide();
            this.tosterService.success('Profile updated successfully!', 'Success');
            this.applyProfileData(response.data);  // Use the data from response
            this.spinnerService.hide();
          }
        });
      } else {
        // Create a new theme settings
        this.spinnerService.show();
        this.systemSettings.createProfile(profile).subscribe((response: any) => {
          if (response.success) {
            this.spinnerService.hide();
            this.tosterService.success('Profile create successfully!', 'Success');
            this.applyProfileData(response.data);  // Use the data from response
          }
        });
      }
    } else {
      this.businessForm.markAllAsTouched(); // Force error messages to display
    }
  }

  applyProfileData(profile: Profile) {
    this.systemSettings.updateProfileValue(profile);
  }

  onApplyTheme() {
    const theme = this.themeForm.value;
    const currentTheme = this.systemSettings.getCurrentThemeSettingsValue();
     // If theme exists, update, otherwise create a new one
     if (currentTheme && currentTheme.id) {
      // Update the theme settings
      this.spinnerService.show();
      this.systemSettings.updateThemeSettings(currentTheme.id, theme).subscribe(response => {
        if (response.success) {
          this.tosterService.success('Theme updated successfully!', 'Success');
          if(response.data)
            this.applyThemeValue(response.data);  // Use the data from response
          this.spinnerService.hide();
        }
      });
    } else {
      // Create a new theme settings
      this.spinnerService.show();
      this.systemSettings.createThemeSettings(theme).subscribe((response: any) => {
        if (response.success) {
          this.tosterService.success('Theme created successfully!', 'Success');
          this.spinnerService.hide();
          this.applyThemeValue(response.data);  // Use the data from response
        }
      });
    }
  }

  applyThemeValue(theme: ThemeSettings) {
    // Update the theme settings
    this.systemSettings.updateThemeSettingsValue(theme);

    // Apply theme styles dynamically to the document
    document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
    document.documentElement.style.setProperty('--background-color', theme.backgroundColor);
    document.documentElement.style.setProperty('--theme-font-family', theme.fontStyle);
    
    // Debug helper - set data attribute for font debugging
    document.body.setAttribute('data-font', theme.fontStyle);
  }

  onResetTheme() {
    this.themeForm.reset({
      primaryColor: environment.defaultThemeSettings.primaryColor,
      secondaryColor: environment.defaultThemeSettings.secondaryColor,
      backgroundColor: environment.defaultThemeSettings.backgroundColor,
      fontStyle: environment.defaultThemeSettings.fontStyle
    });
    this.onApplyTheme();
  }

  // New interactive methods for enhanced UX
  switchTab(tabName: string): void {
    this.activeTab = tabName;
    console.log('Switched to tab:', tabName); // Debug log
  }

  applyPresetTheme(themeName: string): void {
    const themes = {
      default: {
        primaryColor: '#001e3d',
        secondaryColor: '#1b456e',
        backgroundColor: '#f2f7fc',
        fontStyle: 'system-ui'
      },
      dark: {
        primaryColor: '#28a745',
        secondaryColor: '#343a40',
        backgroundColor: '#212529',
        fontStyle: "'Segoe UI', sans-serif"
      },
      purple: {
        primaryColor: '#6f42c1',
        secondaryColor: '#e83e8c',
        backgroundColor: '#f8f9fa',
        fontStyle: "'Roboto', sans-serif"
      },
      ocean: {
        primaryColor: '#17a2b8',
        secondaryColor: '#138496',
        backgroundColor: '#e6f7ff',
        fontStyle: "'Inter', sans-serif"
      },
      sunset: {
        primaryColor: '#fd7e14',
        secondaryColor: '#e55a00',
        backgroundColor: '#fff3e0',
        fontStyle: "'Poppins', sans-serif"
      },
      forest: {
        primaryColor: '#198754',
        secondaryColor: '#146c43',
        backgroundColor: '#f0f8f0',
        fontStyle: "'Nunito', sans-serif"
      },
      rose: {
        primaryColor: '#dc3545',
        secondaryColor: '#b02a37',
        backgroundColor: '#fdf2f8',
        fontStyle: "'Montserrat', sans-serif"
      },
      midnight: {
        primaryColor: '#212529',
        secondaryColor: '#495057',
        backgroundColor: '#f8f9fa',
        fontStyle: "'Source Sans Pro', sans-serif"
      },
      lavender: {
        primaryColor: '#8e44ad',
        secondaryColor: '#9b59b6',
        backgroundColor: '#f4ecf7',
        fontStyle: "'Lato', sans-serif"
      },
      emerald: {
        primaryColor: '#20c997',
        secondaryColor: '#17a2b8',
        backgroundColor: '#e8f5e8',
        fontStyle: "'Open Sans', sans-serif"
      },
      gold: {
        primaryColor: '#ffd700',
        secondaryColor: '#ffb347',
        backgroundColor: '#fffef7',
        fontStyle: "'Playfair Display', serif"
      },
      darkGold: {
        primaryColor: '#b8860b',
        secondaryColor: '#daa520',
        backgroundColor: '#1a1a1a',
        fontStyle: "'Playfair Display', serif"
      },
      darkBlue: {
        primaryColor: '#1e3a8a',
        secondaryColor: '#3b82f6',
        backgroundColor: '#0f172a',
        fontStyle: "'Inter', sans-serif"
      },
      forestMoss: {
        primaryColor: '#2C5F2D',
        secondaryColor: '#97BC62',
        backgroundColor: '#f0f8f0',
        fontStyle: "'Nunito', sans-serif"
      },
      autumnRustic: {
        primaryColor: '#46211A',
        secondaryColor: '#A43820',
        backgroundColor: '#F1D3B2',
        fontStyle: "'Merriweather', serif"
      },
      dreamyPeriwinkle: {
        primaryColor: '#735DA5',
        secondaryColor: '#D3C5E5',
        backgroundColor: '#faf8ff',
        fontStyle: "'Lora', serif"
      },
      timelessSerene: {
        primaryColor: '#31473A',
        secondaryColor: '#6B7B6F',
        backgroundColor: '#EDF4F2',
        fontStyle: "'Source Sans Pro', sans-serif"
      },
      navyBeige: {
        primaryColor: '#1B2951',
        secondaryColor: '#8B7355',
        backgroundColor: '#F5F5DC',
        fontStyle: "'Crimson Text', serif"
      },
      brownBeige: {
        primaryColor: '#8B4513',
        secondaryColor: '#D2B48C',
        backgroundColor: '#F5F5DC',
        fontStyle: "'Libre Baskerville', serif"
      },
      beigeVino: {
        primaryColor: '#7B1F2B',
        secondaryColor: '#A42A3A',
        backgroundColor: '#E0D8C7',
        fontStyle: "'Lato', sans-serif"
      }
    };

    const selectedTheme = themes[themeName as keyof typeof themes];
    if (selectedTheme) {
      this.themeForm.patchValue(selectedTheme);
      
      // Apply preview if enabled
      if (this.isThemePreviewEnabled) {
        this.applyThemePreview();
      }
      
      this.tosterService.info(`Applied ${themeName} theme`, 'Theme Preview');
    }
  }

  applyThemePreview(): void {
    const theme = this.themeForm.value;
    
      // Apply theme styles dynamically to the document for preview
      // Only apply if preview is enabled
      if (this.isThemePreviewEnabled) {
        document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
        document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
        document.documentElement.style.setProperty('--background-color', theme.backgroundColor);
        document.documentElement.style.setProperty('--theme-font-family', theme.fontStyle);
        
        // Debug helper - set data attribute for font debugging
        document.body.setAttribute('data-font', theme.fontStyle);
      }
  }

  testPrinter(type: 'receipt' | 'invoice'): void {
    this.spinnerService.show();
    
    // Simulate printer test
    setTimeout(() => {
      this.spinnerService.hide();
      this.tosterService.success(`${type.charAt(0).toUpperCase() + type.slice(1)} test print sent successfully!`, 'Printer Test');
    }, 2000);
  }

  toggleThemePreview(): void {
    this.isThemePreviewEnabled = !this.isThemePreviewEnabled;
    
    if (this.isThemePreviewEnabled) {
      this.applyThemePreview();
      this.tosterService.info('Theme preview enabled', 'Preview');
    } else {
      // Reset to current saved theme
      const currentTheme = this.systemSettings.getCurrentThemeSettingsValue();
      if (currentTheme) {
        this.applyThemeValue(currentTheme);
      }
      this.tosterService.info('Theme preview disabled', 'Preview');
    }
  }

  // Enhanced error handling with better user feedback
  private showError(message: string, title: string = 'Error'): void {
    this.tosterService.error(message, title);
  }

  private showSuccess(message: string, title: string = 'Success'): void {
    this.tosterService.success(message, title);
  }

  // Method to handle form validation errors more gracefully
  private handleFormErrors(form: FormGroup, formName: string): void {
    if (form.invalid) {
      const errors = this.getFormErrors(form);
      this.showError(`Please fix the following errors in ${formName}: ${errors.join(', ')}`, 'Validation Error');
    }
  }

  private getFormErrors(form: FormGroup): string[] {
    const errors: string[] = [];
    
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control && control.errors) {
        Object.keys(control.errors).forEach(errorKey => {
          switch (errorKey) {
            case 'required':
              errors.push(`${key} is required`);
              break;
            case 'email':
              errors.push(`${key} must be a valid email`);
              break;
            case 'minlength':
              errors.push(`${key} is too short`);
              break;
            case 'maxlength':
              errors.push(`${key} is too long`);
              break;
            default:
              errors.push(`${key} has an invalid value`);
          }
        });
      }
    });
    
    return errors;
  }

}
