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
    this.router.navigate(['/']);
  }
}
