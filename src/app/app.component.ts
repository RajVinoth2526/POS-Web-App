import { Component, OnInit } from '@angular/core';
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
  constructor(private settingsService: SystemService,
              private spinner: NgxSpinnerService,
              private firebaseInitService: FirebaseInitService,
              private orderService: OrderService   
  ) { 
    this.getThemeSettings();
    this.getProfileDetails();
    this.getOrderId();
  }

  ngOnInit(): void {
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
      document.body.style.setProperty('--theme-font-family', theme.fontStyle);
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
