import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AddProductComponent } from './components/add-product/add-product.component';
import { SalesOrderComponent } from './components/sales-order/sales-order.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ViewProductsComponent } from './components/view-products/view-products.component';
import { ViewOrdersComponent } from './components/view-orders/view-orders.component';
import { SalesAnalysisComponent } from './components/sales-analysis/sales-analysis.component';
import { InventoryManagementComponent } from './components/inventory-management/inventory-management.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { AddUserComponent } from './components/add-user/add-user.component';
import { LoginComponent } from './components/login/login.component';
import { PasswordResetComponent } from './components/password-reset/password-reset.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { AuthGuard } from './guards/auth.guard';


const routes: Routes = [
  // Authentication routes (no guard needed)
  { path: 'login', component: LoginComponent },
  { path: 'register', component: AddUserComponent },
  { path: 'password-reset', component: PasswordResetComponent },
  { path: 'profile', component: UserProfileComponent, canActivate: [AuthGuard] },
  
  
  // Main application routes (protected by AuthGuard)
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'home', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'add-product', component: AddProductComponent, canActivate: [AuthGuard] },
  { path: 'sales-order-process', component: SalesOrderComponent, canActivate: [AuthGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
  { path: 'view-products', component: ViewProductsComponent, canActivate: [AuthGuard] },
  { path: 'edit-product/:id', component: AddProductComponent, canActivate: [AuthGuard] },
  { path: 'view-orders', component: ViewOrdersComponent, canActivate: [AuthGuard] },
  { path: 'sales-analysis', component: SalesAnalysisComponent, canActivate: [AuthGuard] },
  { path: 'inventory', component: InventoryManagementComponent, canActivate: [AuthGuard] },
  { path: 'users', component: UserManagementComponent, canActivate: [AuthGuard] },
  { path: 'add-user', component: AddUserComponent, canActivate: [AuthGuard] },

  // Wildcard route - redirect to login
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
