import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse, Cart, Filter, OrderId, ApiOrder, ApiOrderResponse } from '../model/system.model';
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

  /**
   * Transforms API order response to Cart format
   */
  private transformApiOrderToCart(apiOrder: ApiOrder): Cart {
    console.log('Transforming API order:', apiOrder);
    
    const transformedCart: Cart = {
      id: apiOrder.id.toString(),
      orderId: apiOrder.orderNumber,
      orderItems: apiOrder.orderItems.map(item => ({
        product: {
          id: item.productId.toString(),
          name: item.productName,
          price: item.unitPrice,
          unitType: '',
          unit: '',
          isAvailable: true,
          isPartialAllowed: false,
          description: '',
          stockQuantity: 0,
          sku: '',
          barcode: '',
          category: '',
          unitValue: 0,
          taxRate: 0,
          manufactureDate: new Date(),
          expiryDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        productId: item.productId.toString(),
        name: item.productName,
        price: item.unitPrice,
        quantity: item.quantity,
        total: item.totalAmount,
        tax: item.taxAmount,
        discount: item.discountAmount,
        size: undefined
      })),
      subtotal: apiOrder.subTotal,
      taxAmount: apiOrder.taxAmount,
      discountAmount: apiOrder.discountAmount,
      totalAmount: apiOrder.totalAmount,
      paymentMethod: apiOrder.paymentMethod,
      customerName: apiOrder.customerName,
      notes: apiOrder.notes,
      createdAt: new Date(apiOrder.createdAt),
      updatedAt: new Date(apiOrder.updatedAt),
      cartDate: new Date(apiOrder.orderDate).toISOString().split('T')[0],
      isTakeaway: false
    };
    
    console.log('Transformed cart:', transformedCart);
    return transformedCart;
  }

  /**
   * Creates a clean cart object without image URLs for database storage
   * @param cart The original cart object
   * @returns A clean cart object with image URLs removed
   */
  private createCleanCart(cart: Cart): Cart {
    return {
      ...cart,
      orderItems: cart.orderItems.map(item => ({
        ...item,
        productId: item.productId || item.product.id, // Ensure productId exists for backward compatibility
        product: {
          ...item.product,
          image: undefined // Remove image URL
        }
      }))
    };
  }

  saveOrder(data: Cart): Observable<ApiResponse<Cart>> {
    // Create clean cart without image URLs before saving
    const cleanData = this.createCleanCart(data);
    
    if (environment.systemMode == 1) {
      return this.firebaseOrderService.saveOrder(cleanData).pipe(
        map((order: Cart) => ({
          data: order,
          message: 'Success',
          success: true
        }))
      );
    } else {
      return this.http.post<ApiResponse<Cart>>(`${environment.apiUrl}api/orders`, cleanData);
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
          success: true,
          totalCount: products.length
        }))
      );
    } else {
      let url = `${environment.apiUrl}api/orders`;
      if(filter) { 
        url = `${url}?${Object.entries(filter).map(([key, value]) => `${key}=${value}`).join('&')}`;
      }
      return this.http.get<{success: boolean, message: string, data: ApiOrderResponse}>(`${url}`).pipe(
        map(response => {
          console.log('Raw API response:', response);
          console.log('API response data:', response.data);
          console.log('API response items:', response.data.items);
          
          const transformedData = response.data.items.map(apiOrder => this.transformApiOrderToCart(apiOrder));
          console.log('Transformed data:', transformedData);
          
          return {
            data: transformedData,
            message: response.message,
            success: response.success,
            totalCount: response.data.totalCount
          };
        })
      );
    }
  }

  deleteOrder(id: string): Observable<ApiResponse<Cart>> {
      if (environment.systemMode == 1) {
        return this.firebaseOrderService.deleteOrderById(id.toString()).pipe(
          map(() => ({
            data: null, // this is allowed only if ApiResponse<Product> accepts null
            message: 'Product deleted successfully',
            success: true
          }))
        );
      } else {
        return this.http.delete<ApiResponse<Cart>>(`${environment.apiUrl}api/orders/${id}`);
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
