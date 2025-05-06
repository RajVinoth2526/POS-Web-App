import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AddProductComponent } from './components/add-product/add-product.component';
import { SalesOrderComponent } from './components/sales-order/sales-order.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ViewProductsComponent } from './components/view-products/view-products.component';


const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'add-product', component: AddProductComponent },
  { path: 'sales-order-process', component: SalesOrderComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'view-products', component: ViewProductsComponent },
  { path: 'edit-product/:id', component: AddProductComponent }

  // Add more routes as needed
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
