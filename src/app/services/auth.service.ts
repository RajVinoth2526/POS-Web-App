import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../service/user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        const expiresAt = localStorage.getItem('token_expires_at');
        
        // Check if token is still valid
        if (expiresAt && new Date(expiresAt) > new Date()) {
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
        } else {
          this.clearAuth();
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.clearAuth();
      }
    }
  }

  // Set authentication data
  setAuth(user: User, token: string, refreshToken: string, expiresAt: Date, rememberMe: boolean = false): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem('auth_token', token);
    storage.setItem('refresh_token', refreshToken);
    storage.setItem('user_data', JSON.stringify(user));
    storage.setItem('token_expires_at', expiresAt.toString());
    
    // Also store in session storage for immediate access
    if (rememberMe) {
      sessionStorage.setItem('auth_token', token);
      sessionStorage.setItem('user_data', JSON.stringify(user));
    }
    
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  // Clear authentication data
  clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('token_expires_at');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_data');
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  // Get auth token
  getToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (expiresAt) {
      return new Date(expiresAt) <= new Date();
    }
    return true;
  }

  // Update user data
  updateUser(user: User): void {
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === user.id) {
      this.currentUserSubject.next(user);
      
      // Update stored user data
      const userData = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
      if (userData) {
        const storage = localStorage.getItem('user_data') ? localStorage : sessionStorage;
        storage.setItem('user_data', JSON.stringify(user));
      }
    }
  }
}