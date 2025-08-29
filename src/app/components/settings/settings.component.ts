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
  constructor(
    private fb: FormBuilder,
    private systemSettings: SystemService,
    private spinnerService: NgxSpinnerService,
    private tosterService: ToastrService,
    
  ) {
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
    document.body.style.setProperty('--theme-font-family', theme.fontStyle);
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

}
