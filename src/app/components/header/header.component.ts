import { Component, OnDestroy, OnInit, Output, EventEmitter  } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { SystemService } from 'src/app/service/system.service';
import { UserService, User } from 'src/app/service/user.service';
import { Profile } from '../../model/system.model';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { filter } from 'rxjs/operators';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  companyName: string = "";
  currentUser: User | null = null;
  private subscriptions: Subscription[] = [];
  @Output() toggle = new EventEmitter<void>();

  constructor(
    private systemService: SystemService,
    private userService: UserService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const profileSubs = this.systemService.profile$.subscribe((data: Profile | null) => {
      if(data == null) {
        this.companyName = environment.companyName;
      } else {
        this.companyName = data.businessName;
      }
    });
    this.subscriptions.push(profileSubs);

    // Load current user data
    this.loadCurrentUser();

    // Listen for route changes to refresh user data
    const routerSubs = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.loadCurrentUser();
      });
    this.subscriptions.push(routerSubs);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleSidebar() {
    this.toggle.emit();
  }

  // Load current user from storage
  private loadCurrentUser(): void {
    const userData = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    if (userData && token) {
      try {
        this.currentUser = JSON.parse(userData);
        console.log('Header: Loaded current user:', this.currentUser?.username);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.currentUser = null;
      }
    } else {
      this.currentUser = null;
      console.log('Header: No user data or token found');
    }
  }

  // Get user display name
  getUserDisplayName(): string {
    if (this.currentUser) {
      return this.userService.getUserDisplayName(this.currentUser);
    }
    return 'User';
  }

  // Handle profile click
  onProfile(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/profile']);
  }

  // Handle settings click
  onSettings(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/settings']);
  }

  // Handle logout
  onLogout(event: Event): void {
    event.preventDefault();
    
    console.log('Header: Logout initiated by user:', this.currentUser?.username);
    
    // Call logout API
    this.userService.logoutUser().subscribe({
      next: (response) => {
        console.log('Logout successful:', response);
        this.clearAuthData();
        this.toastr.success('Logged out successfully', 'Goodbye!');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Even if API call fails, clear local data and redirect
        this.clearAuthData();
        this.toastr.info('Logged out locally', 'Goodbye!');
        this.router.navigate(['/login']);
      }
    });
  }

  // Clear authentication data
  private clearAuthData(): void {
    console.log('Header: Clearing authentication data');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('token_expires_at');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user_data');
    sessionStorage.removeItem('token_expires_at');
    this.currentUser = null;
  }

}
