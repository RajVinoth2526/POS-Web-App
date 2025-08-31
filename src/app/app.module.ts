import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ProductListComponent } from './components/product-list/product-list.component';
import { CartComponent } from './components/cart/cart.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { AddProductComponent } from './components/add-product/add-product.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SalesOrderComponent } from './components/sales-order/sales-order.component';
import { SettingsComponent } from './components/settings/settings.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { ViewProductsComponent } from './components/view-products/view-products.component';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { environment } from 'src/environments/environment';
import { AngularFireModule } from '@angular/fire/compat';
import { ViewOrdersComponent } from './components/view-orders/view-orders.component'; 
import { MatExpansionModule } from '@angular/material/expansion'; // Import MatExpansion
import { MatSliderModule } from '@angular/material/slider'; // Import MatSlider
import { MatButtonModule } from '@angular/material/button'; // For buttons
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmationComponent } from './components/confirmation/confirmation.component';
import { MatDialogModule } from '@angular/material/dialog';
import { SliderComponent } from './components/slider/slider.component';
import { AddProductPopupComponent } from './components/add-product-popup/add-product-popup.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { SalesAnalysisComponent } from './components/sales-analysis/sales-analysis.component';
// import { NgChartsModule } from 'ng2-charts';
@NgModule({
  declarations: [
    AppComponent,
    ProductListComponent,
    CartComponent,
    DashboardComponent,
    HeaderComponent,
    FooterComponent,
    AddProductComponent,
    SalesOrderComponent,
    SettingsComponent,
    ViewProductsComponent,
    ViewOrdersComponent,
    ConfirmationComponent,
    SliderComponent,
    AddProductPopupComponent,
    PaginationComponent,
    SalesAnalysisComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    NgxSpinnerModule,
    MatExpansionModule,       // Import MatExpansion
    MatSliderModule,          // Import MatSlider
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    // NgChartsModule,
    ToastrModule.forRoot(),
    AngularFireModule.initializeApp(environment.firebase), // Initialize Firebase
    AngularFireAuthModule, // For Authentication
    AngularFirestoreModule, // For Firestore
    AngularFirestoreModule.enablePersistence(), 
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {

 }
