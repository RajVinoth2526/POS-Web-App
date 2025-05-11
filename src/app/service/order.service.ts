import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse, Cart, Filter, OrderId } from '../model/system.model';
import { environment } from 'src/environments/environment';
import { OrderService as FirebaseOrderService } from '../firebase/fire-servie/order.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor(private firebaseOrderService: FirebaseOrderService,
    private http: HttpClient
  ) { }

  saveOrder(data: Cart): Observable<ApiResponse<Cart>> {
    if (environment.systemMode == 1) {
      return this.firebaseOrderService.saveOrder(data).pipe(
        map((order: Cart) => ({
          data: order,
          message: 'Success',
          success: true
        }))
      );
    } else {
      return this.http.post<ApiResponse<Cart>>(`${environment.apiUrl}api/products/order`, data);
    }
  }

  saveOrderId(data: OrderId): Observable<ApiResponse<OrderId>> {
    if (environment.systemMode == 1) {
      return this.firebaseOrderService.saveOrderId(data).pipe(
        map((order: OrderId) => ({
          data: order,
          message: 'Success',
          success: true
        }))
      );
    } else {
      return this.http.post<ApiResponse<OrderId>>(`${environment.apiUrl}api/products/order`, data);
    }
  }

  updateOrderId(data: OrderId): Observable<ApiResponse<OrderId>> {
    if (environment.systemMode == 1 && data.id) {
      return this.firebaseOrderService.updateOrderId(data.id.toString(), data).pipe(
        map((product: OrderId) => ({
          data: product,
          message: 'Success',
          success: true
        }))
      );
    } else {
      return this.http.patch<ApiResponse<OrderId>>(`${environment.apiUrl}api/products/${data.id}`, data);
    }
  }

  // getAllProfile
  getAllOrders(filter?: Filter): Observable<ApiResponse<Cart[]>> {
    if (environment.systemMode == 1) {
      return this.firebaseOrderService.getAllOrders(filter).pipe(
        map((products: Cart[]) => ({
          data: products,
          message: 'Success',
          success: true
        }))
      );
    } else {
      return this.http.get<ApiResponse<Cart[]>>(`${environment.apiUrl}api/Orders`);
    }
  }

  getOrderId(): Observable<ApiResponse<OrderId[]>> {
    if (environment.systemMode == 1) {
      return this.firebaseOrderService.getOrderId().pipe(
        map((products: OrderId[]) => ({
          data: products,
          message: 'Success',
          success: true
        }))
      );
    } else {
      return this.http.get<ApiResponse<OrderId[]>>(`${environment.apiUrl}api/Orders`);
    }
  }
}
