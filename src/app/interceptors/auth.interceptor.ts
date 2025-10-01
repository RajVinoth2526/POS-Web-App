import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    console.log('AuthInterceptor: Intercepting request to:', request.url);
    
    // Get the auth token from storage
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    if (token) {
      console.log('AuthInterceptor: Adding token to request');
      // Clone the request and add the authorization header
      const authRequest = request.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return next.handle(authRequest).pipe(
        catchError((error: HttpErrorResponse) => {
          console.log('AuthInterceptor: HTTP Error:', error.status, error.message);
          
          if (error.status === 401) {
            console.log('AuthInterceptor: 401 Unauthorized - clearing auth data and redirecting to login');
            console.log('AuthInterceptor: Current URL:', this.router.url);
            // Clear authentication data
            this.clearAuthData();
            // Only redirect to login if not already on login page
            if (this.router.url !== '/login' && !this.router.url.includes('/login')) {
              console.log('AuthInterceptor: Redirecting to login from:', this.router.url);
              this.router.navigate(['/login']);
            } else {
              console.log('AuthInterceptor: Already on login page, not redirecting');
            }
          }
          
          return throwError(() => error);
        })
      );
    } else {
      console.log('AuthInterceptor: No token found, proceeding without auth header');
      return next.handle(request).pipe(
        catchError((error: HttpErrorResponse) => {
          console.log('AuthInterceptor: HTTP Error (no token):', error.status, error.message);
          return throwError(() => error);
        })
      );
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('token_expires_at');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_data');
  }
}