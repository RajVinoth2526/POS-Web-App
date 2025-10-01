import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  resetToken: string;
  expiresAt: string;
  instructions: {
    step1: string;
    step2: string;
    step3: string;
    note: string;
  };
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface ValidateTokenRequest {
  token: string;
}

export interface ValidateTokenResponse {
  success: boolean;
  data: {
    message: string;
    expiresAt: string;
    isValid: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PasswordResetService {

  constructor(private http: HttpClient) { }

  forgotPassword(request: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${environment.apiUrl}api/password-reset/forgot`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${environment.apiUrl}api/password-reset/reset`, request);
  }

  validateToken(request: ValidateTokenRequest): Observable<ValidateTokenResponse> {
    return this.http.post<ValidateTokenResponse>(`${environment.apiUrl}api/password-reset/validate-token`, request);
  }
}





