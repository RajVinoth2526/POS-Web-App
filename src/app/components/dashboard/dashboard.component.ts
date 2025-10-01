import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  constructor(private router: Router) {}

  dashboardItems = [
    { name: 'Sales', icon: 'fas fa-dollar-sign', route: '/sales-order-process' },
    { name: 'Add Product', icon: 'fas fa-plus-square', route: '/add-product' },
    { name: 'View Products', icon: 'fas fa-boxes', route: '/view-products' },
    { name: 'Sales Analysis', icon: 'fas fa-chart-line', route: '/sales-analysis' },
    { name: 'Orders', icon: 'fas fa-shopping-cart', route: '/view-orders' },
    { name: 'Inventory', icon: 'fas fa-warehouse', route: '/inventory' },
    { name: 'Users', icon: 'fas fa-users', route: '/users' },
    { name: 'Reports', icon: 'fas fa-file-alt', route: '/reports' },
    { name: 'Settings', icon: 'fas fa-cogs', route: '/settings' }
  ];

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  getCardDescription(name: string): string {
    const descriptions: { [key: string]: string } = {
      'Sales': 'Process new sales transactions',
      'Add Product': 'Add new products to inventory',
      'View Products': 'Browse and manage products',
      'Sales Analysis': 'View sales reports and analytics',
      'Orders': 'Manage customer orders',
      'Inventory': 'Track and manage inventory',
      'Users': 'Manage system users and permissions',
      'Reports': 'Generate business reports',
      'Settings': 'Configure system settings'
    };
    return descriptions[name] || 'Access this feature';
  }

  ngOnInit(): void {
  }

}
