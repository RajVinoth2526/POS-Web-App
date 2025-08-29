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

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

}
