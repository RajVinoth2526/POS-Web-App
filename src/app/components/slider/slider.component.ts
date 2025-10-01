import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css']
})
export class SliderComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  onClose() {
    this.close.emit(); // Let parent component handle close logic
  }

  navigateTo(route: string, event?: Event) {
    if (event) {
      event.preventDefault();
    }
    this.router.navigate([route]);
  }

  navigateToHome(event: Event) {
    event.preventDefault();
    
    // Check if user is authenticated
    const localToken = localStorage.getItem('auth_token');
    const sessionToken = sessionStorage.getItem('auth_token');
    const token = localToken || sessionToken;
    
    console.log('Slider: Checking authentication for home navigation...');
    console.log('Slider: localStorage token:', localToken ? 'EXISTS' : 'NOT FOUND');
    console.log('Slider: sessionStorage token:', sessionToken ? 'EXISTS' : 'NOT FOUND');
    console.log('Slider: Final token:', token ? 'EXISTS' : 'NOT FOUND');
    
    if (token) {
      // User is authenticated, go to dashboard
      console.log('Slider: User is authenticated, navigating to dashboard');
      this.router.navigate(['/dashboard']).then(success => {
        console.log('Slider: Navigation to dashboard result:', success);
        if (success) {
          console.log('Slider: Successfully navigated to dashboard');
        } else {
          console.log('Slider: Failed to navigate to dashboard');
        }
      }).catch(error => {
        console.error('Slider: Navigation error:', error);
      });
    } else {
      // User is not authenticated, go to login
      console.log('Slider: User is not authenticated, navigating to login');
      this.router.navigate(['/login']).then(success => {
        console.log('Slider: Navigation to login result:', success);
      }).catch(error => {
        console.error('Slider: Navigation error:', error);
      });
    }
  }

}
