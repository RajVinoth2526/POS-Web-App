import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    console.log('AuthGuard: Checking access to route:', state.url);
    
    // Check if user is authenticated
    const localToken = localStorage.getItem('auth_token');
    const sessionToken = sessionStorage.getItem('auth_token');
    const token = localToken || sessionToken;
    console.log('AuthGuard: localStorage token:', !!localToken);
    console.log('AuthGuard: sessionStorage token:', !!sessionToken);
    console.log('AuthGuard: Final token:', !!token);
    
    if (token) {
      // Check if token is still valid
      const expiresAt = localStorage.getItem('token_expires_at') || sessionStorage.getItem('token_expires_at');
      console.log('AuthGuard: Token expires at:', expiresAt);
      
      if (expiresAt) {
        const expirationDate = new Date(expiresAt);
        const now = new Date();
        console.log('AuthGuard: Current time:', now);
        console.log('AuthGuard: Expiration time:', expirationDate);
        console.log('AuthGuard: Token valid:', expirationDate > now);
        
        if (expirationDate > now) {
          console.log('AuthGuard: Token is valid, allowing access');
          return true; // User is authenticated and token is valid
        } else {
          console.log('AuthGuard: Token expired, redirecting to login');
          // Token expired, clear storage and redirect to login
          this.clearAuthData();
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return false;
        }
      } else {
        console.log('AuthGuard: No expiration date found, allowing access (token exists)');
        return true; // Token exists but no expiration date, allow access
      }
    } else {
      console.log('AuthGuard: No token found, redirecting to login');
      // No token found, redirect to login
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
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
