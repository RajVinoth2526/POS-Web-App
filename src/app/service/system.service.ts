import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, OrderId, Profile, ThemeSettings } from '../model/system.model';
import { environment } from 'src/environments/environment';
import { SystemService as FirebaseProductService } from '../firebase/fire-servie/system.service';
import { switchMap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SystemService {
  private themeSettingsSubject = new BehaviorSubject<ThemeSettings | null>(null);
  themeSettings$ = this.themeSettingsSubject.asObservable();

  private profileSubject = new BehaviorSubject<Profile | null>(null);
  profile$ = this.profileSubject.asObservable();

  private currencySubject = new BehaviorSubject<string | null>(environment.currency);
  currency$ = this.currencySubject.asObservable();

  private orderIdSubject = new BehaviorSubject<OrderId | null>(null);
  orderIdSubject$ = this.orderIdSubject.asObservable();


  constructor(
    private http: HttpClient,
    private firebaseSystemService: FirebaseProductService
  ) { }

  updateThemeSettingsValue(settings: ThemeSettings) {
    this.themeSettingsSubject.next(settings);
  }

  getCurrentThemeSettingsValue(): ThemeSettings | null {
    return this.themeSettingsSubject.value;
  }

  updateOrderIdValue(orderId: OrderId) {
    this.orderIdSubject.next(orderId);
  }

  getOrderIdValue(): OrderId | null {
    return this.orderIdSubject.value;
  }

  updateCurrencyValue(currency: string) {
    this.currencySubject.next(currency);
  }

  getCurrencyValue(): string | null {
    return this.currencySubject.value;
  }


  updateProfileValue(profile: Profile) {
    this.profileSubject.next(profile);
  }

  getProfileValue(): Profile | null {
    return this.profileSubject.value;
  }

  getThemeSettings(id: string): Observable<ThemeSettings> {
    if (environment.systemMode === 1) {
      return this.firebaseSystemService.getThemeSettings(id.toString()).pipe(
        switchMap((theme: ThemeSettings | undefined) => {
          if (!theme) {
            return throwError(() => new Error('Theme settings not found'));
          }
          return [theme]; // Wrap the theme in an array to return an Observable<ThemeSettings>
        })
      );
    } else {
      return this.http.get<ThemeSettings>(`${environment.apiUrl}api/system/theme-settings/${id}`);
    }
  }

  createThemeSettings(data: ThemeSettings): Observable<ApiResponse<ThemeSettings>> {
    if (environment.systemMode === 1) {
      return this.firebaseSystemService.createThemeSettings(data).pipe(
        map((theme: ThemeSettings) => ({
          data: theme,
          message: 'Success',
          success: true
        }))
      );
    } else {
      return this.http.post<ApiResponse<ThemeSettings>>(`${environment.apiUrl}api/system/theme-settings`, data);
    }
  }

  updateThemeSettings(id: string, data: Partial<ThemeSettings>): Observable<ApiResponse<ThemeSettings>> {
    if (environment.systemMode === 1) {
      return this.firebaseSystemService.updateThemeSettings(id.toString(), data).pipe(
        map((theme: ThemeSettings) => ({
          data: theme,
          message: 'Success',
          success: true
        }))
      );
    } else {
      return this.http.patch<ApiResponse<ThemeSettings>>(`${environment.apiUrl}api/system/theme-settings/${id}`, data);
    }
  }

  getAllSystemThemeSettings(): Observable<ApiResponse<ThemeSettings[]>> {
    if (environment.systemMode === 1) {
      return this.firebaseSystemService.getAllSystemThemeSettings().pipe(
        map((themes: ThemeSettings[]) => ({
          data: themes,
          message: 'Success',
          success: true
        }))
      );
    } else {
      return this.http.get<ApiResponse<ThemeSettings[]>>(`${environment.apiUrl}api/system/theme-settings`);
    }
  }
  getProfileData(id: string): Observable<Profile> {
    if (environment.systemMode === 1) {
      return this.firebaseSystemService.getProfileData(id.toString()).pipe(
        switchMap((profile: Profile | undefined) => {
          if (!profile) {
            return throwError(() => new Error('Profile data not found'));
          }
          return of(profile); // Wrap the profile in an observable to return Observable<Profile>
        })
      );
    } else {
      return this.http.get<Profile>(`${environment.apiUrl}api/system/profile/${id}`);
    }
  }

  createProfile(data: Profile): Observable<ApiResponse<Profile>> {
    if (environment.systemMode === 1) {
      return this.firebaseSystemService.createProfile(data).pipe(
        map((profile: Profile) => ({
          data: profile,
          message: 'Success',
          success: true
        }))
      );
    } else {
      return this.http.post<ApiResponse<Profile>>(`${environment.apiUrl}api/system/profile`, data);
    }
  }

  updateProfile(id: string, data: Partial<Profile>): Observable<ApiResponse<Profile>> {
    if (environment.systemMode === 1) {
      return this.firebaseSystemService.updateProfile(id.toString(), data).pipe(
        map((profile: Profile) => ({
          data: profile,
          message: 'Success',
          success: true
        }))
      );
    } else {
      return this.http.patch<ApiResponse<Profile>>(`${environment.apiUrl}api/system/profile/${id}`, data);
    }
  }

  getAllProfile(): Observable<ApiResponse<Profile[]>> {
    if (environment.systemMode === 1) {
      return this.firebaseSystemService.getAllProfile().pipe(
        map((profiles: Profile[]) => ({
          data: profiles,
          message: 'Success',
          success: true
        }))
      );
    } else {
      return this.http.get<ApiResponse<Profile[]>>(`${environment.apiUrl}api/system/profile`);
    }
  }
}
