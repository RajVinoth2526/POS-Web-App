import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ApiResponse, OrderId, Profile, ThemeSettings } from './model/system.model';
import { environment } from 'src/environments/environment';
import { env } from 'process';
import { SystemService } from './service/system.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { FirebaseInitService } from './firebase/firebase-init.service';
import { OrderService } from './service/order.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  isSidebarOpen = false;
  isAuthPage = false;
  
  constructor(private settingsService: SystemService,
              private spinner: NgxSpinnerService,
              private firebaseInitService: FirebaseInitService,
              private orderService: OrderService,
              private router: Router   
  ) { 
    this.getThemeSettings();
    this.getProfileDetails();
   // this.getOrderId();
  }

  ngOnInit(): void {
    // Track route changes to determine if we're on auth pages
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isAuthPage = event.url === '/login' || event.url === '/register' || event.url === '/password-reset';
        console.log('Current route:', event.url, 'Is auth page:', this.isAuthPage);
      });
    
    // Check initial route
    this.isAuthPage = this.router.url === '/login' || this.router.url === '/register' || this.router.url === '/password-reset';
    console.log('Initial route:', this.router.url, 'Is auth page:', this.isAuthPage);
  }

  getOrderId() {
    this.spinner.show();
    this.orderService.getOrderId().subscribe((response: ApiResponse<OrderId[]>) => {  
      this.spinner.hide();
      const orderIds = response.data;
      if(orderIds && orderIds.length == 0) {
        const orderid: OrderId = {value: environment.orderId};
        this.orderService.saveOrderId(orderid).subscribe((response: any) => {
          if (response.success) {
            this.settingsService.updateOrderIdValue(response.data);
            this.spinner.hide();
          }
        });
      }
      const orderId = orderIds?.[0];
      if(orderId)
        this.settingsService.updateOrderIdValue(orderId);

    });

  }

  getThemeSettings() {
    this.spinner.show();
    this.settingsService.getAllSystemThemeSettings()
    .subscribe((response: ApiResponse<ThemeSettings[]>) => {
      this.spinner.hide();
      const themes = response.data;
      const theme = themes?.[0] || environment.defaultThemeSettings;
  
      this.settingsService.updateThemeSettingsValue(theme);
  
      document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
      document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
      document.documentElement.style.setProperty('--background-color', theme.backgroundColor);
      document.documentElement.style.setProperty('--theme-font-family', theme.fontStyle);
      
      // Debug helper - set data attribute for font debugging
      document.body.setAttribute('data-font', theme.fontStyle);
    });
  
  }

  getProfileDetails() {
    this.spinner.show();
    this.settingsService.getAllProfile()
    .subscribe((response: ApiResponse<Profile[]>) => {
      this.spinner.hide();
      const profiles = response.data;
      const profile = profiles?.[0] ?? null;
      if(profile)
        this.settingsService.updateProfileValue(profile);
    });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
