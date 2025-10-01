import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, pipe, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// User-related interfaces based on the API
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  phoneNumber?: string;
  department?: string;
  status?: string; // Make status optional since backend might not provide it
}

export interface RegisterDto {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  role: string;
  department: string;
  phoneNumber?: string;
  isActive: boolean;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface UserUpdateDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  department?: string;
  role?: string;
  isActive?: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordDto {
  email: string;
}

export interface UserFilterDto {
  searchQuery?: string;
  role?: string;
  status?: string;
  department?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: string;
  page: number;
  pageSize: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface LoginResult {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = `${environment.apiUrl}api/users`;

  constructor(private http: HttpClient) {}

  // User Registration
  registerUser(userData: RegisterDto): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/register`, userData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // User Login
  loginUser(loginData: LoginDto): Observable<ApiResponse<LoginResult>> {
    console.log('UserService: Making login request to:', `${this.baseUrl}/login`);
    console.log('UserService: Login data:', loginData);
    
    return this.http.post<ApiResponse<LoginResult>>(`${this.baseUrl}/login`, loginData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // User Logout
  logoutUser(): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/logout`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  // Logout All Sessions
  logoutAllSessions(): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/logout-all`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get Current User
  getCurrentUser(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/me`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get User by ID
  getUserById(id: number): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get All Users with Filters
  getAllUsers(filters: UserFilterDto): Observable<ApiResponse<PagedResult<User>>> {
    let params = new HttpParams()
      .set('Page', filters.page.toString())
      .set('PageSize', filters.pageSize.toString());

    // Only send parameters that the API actually supports
    if (filters.role && filters.role !== 'all') {
      params = params.set('Role', filters.role);
    }
    if (filters.isActive !== undefined) {
      params = params.set('IsActive', filters.isActive.toString());
    }

    return this.http.get<ApiResponse<PagedResult<User>>>(`${this.baseUrl}`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Update User
  updateUser(id: number, updateData: UserUpdateDto): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.baseUrl}/${id}`, updateData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Delete User
  deleteUser(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.baseUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Change Password
  changePassword(passwordData: ChangePasswordDto): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/change-password`, passwordData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Reset Password
  resetPassword(resetData: ResetPasswordDto): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/reset-password`, resetData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Validate Token
  validateToken(token: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/validate-token`, token)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get Users by Role
  getUsersByRole(role: string, page: number = 1, pageSize: number = 10): Observable<ApiResponse<PagedResult<User>>> {
    const params = new HttpParams()
      .set('Page', page.toString())
      .set('PageSize', pageSize.toString());

    return this.http.get<ApiResponse<PagedResult<User>>>(`${this.baseUrl}/role/${role}`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get Active Users
  getActiveUsers(page: number = 1, pageSize: number = 10): Observable<ApiResponse<PagedResult<User>>> {
    const params = new HttpParams()
      .set('Page', page.toString())
      .set('PageSize', pageSize.toString());

    return this.http.get<ApiResponse<PagedResult<User>>>(`${this.baseUrl}/active`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Helper method to extract data from API response
  extractData<T>(response: ApiResponse<T>): T {
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'API request failed');
  }

  // Error handling
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    
    console.error('User Service Error Details:', error);
    console.error('Error status:', error.status);
    console.error('Error message:', error.message);
    console.error('Error error:', error.error);
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status) {
      errorMessage = `HTTP Error: ${error.status}`;
    }

    console.error('User Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  // Utility method to check if user has role
  hasRole(user: User, role: string): boolean {
    return user.role.toLowerCase() === role.toLowerCase();
  }

  // Utility method to check if user is admin
  isAdmin(user: User): boolean {
    return this.hasRole(user, 'admin');
  }

  // Utility method to check if user is manager
  isManager(user: User): boolean {
    return this.hasRole(user, 'manager');
  }

  // Utility method to get user display name
  getUserDisplayName(user: User): string {
    return `${user.firstName} ${user.lastName}`.trim() || user.username;
  }

  // Utility method to get user initials for avatar
  getUserInitials(user: User): string {
    const firstName = user.firstName?.charAt(0) || '';
    const lastName = user.lastName?.charAt(0) || '';
    return (firstName + lastName).toUpperCase();
  }
}
