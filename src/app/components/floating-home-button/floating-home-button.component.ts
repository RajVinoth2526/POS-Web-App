import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-floating-home-button',
  templateUrl: './floating-home-button.component.html',
  styleUrls: ['./floating-home-button.component.css']
})
export class FloatingHomeButtonComponent {

  constructor(private router: Router) { }

  goToHome(): void {
    // Check if user is authenticated
    const localToken = localStorage.getItem('auth_token');
    const sessionToken = sessionStorage.getItem('auth_token');
    const token = localToken || sessionToken;
    
    console.log('FloatingHomeButton: Checking authentication...');
    console.log('FloatingHomeButton: localStorage token:', localToken ? 'EXISTS' : 'NOT FOUND');
    console.log('FloatingHomeButton: sessionStorage token:', sessionToken ? 'EXISTS' : 'NOT FOUND');
    console.log('FloatingHomeButton: Final token:', token ? 'EXISTS' : 'NOT FOUND');
    
    if (token) {
      // User is authenticated, go to dashboard
      console.log('FloatingHomeButton: User is authenticated, navigating to dashboard');
      this.router.navigate(['/dashboard']).then(success => {
        console.log('FloatingHomeButton: Navigation to dashboard result:', success);
        if (success) {
          console.log('FloatingHomeButton: Successfully navigated to dashboard');
        } else {
          console.log('FloatingHomeButton: Failed to navigate to dashboard');
        }
      }).catch(error => {
        console.error('FloatingHomeButton: Navigation error:', error);
      });
    } else {
      // User is not authenticated, go to login
      console.log('FloatingHomeButton: User is not authenticated, navigating to login');
      this.router.navigate(['/login']).then(success => {
        console.log('FloatingHomeButton: Navigation to login result:', success);
      }).catch(error => {
        console.error('FloatingHomeButton: Navigation error:', error);
      });
    }
  }
}
