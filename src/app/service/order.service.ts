import { Injectable } from '@angular/core';
import { map, Observable, switchMap, catchError } from 'rxjs';
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
   * Get default product image URL
   */
  private getDefaultProductImage(): string {
    // Return a simple placeholder image as data URL
    // You can replace this with your actual default image URL
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y4ZjlmYSIvPgogIDx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNmM3NTdkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Qcm9kdWN0PC90ZXh0Pgo8L3N2Zz4K';
  }

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
          image: this.getDefaultProductImage(), // Add default image for products
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
      isTakeaway: false,
      // ✅ CRITICAL FIX: Map isDraft and orderStatus from API response
      isDraft: apiOrder.isDraft,
      orderStatus: apiOrder.orderStatus
    };
    
    console.log('Transformed cart with status:', {
      orderId: transformedCart.orderId,
      isDraft: transformedCart.isDraft,
      orderStatus: transformedCart.orderStatus,
      fullCart: transformedCart
    });
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
    
    if (environment.systemMode == 2) { // OffLine mode - use Firebase
      return this.firebaseOrderService.saveOrder(cleanData).pipe(
        map((order: Cart) => ({
          data: order,
          message: 'Success',
          success: true
        }))
      );
    } else {
      // Check if this is an existing order (has ID) - use PUT for updates, POST for new orders
      if (cleanData.id) {
        console.log('🔄 Updating existing order with ID:', cleanData.id);
        return this.http.put<ApiResponse<Cart>>(`${environment.apiUrl}api/orders/${cleanData.id}`, cleanData);
      } else {
        console.log('➕ Creating new order');
        return this.http.post<ApiResponse<Cart>>(`${environment.apiUrl}api/orders`, cleanData);
      }
    }
  }

  saveOrderId(data: OrderId): Observable<ApiResponse<OrderId>> {
    if (environment.systemMode == 2) { // OffLine mode - use Firebase
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
    if (environment.systemMode == 2 && data.id) { // OffLine mode - use Firebase
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
    if (environment.systemMode == 2) { // OffLine mode - use Firebase
      return this.firebaseOrderService.getAllOrders(filter).pipe(
        map((products: Cart[]) => ({
          data: products,
          message: 'Success',
          success: true,
          totalCount: products.length
        }))
      );
    } else { // Online mode - use API
      let url = `${environment.apiUrl}api/orders`;
      if(filter) { 
        url = `${url}?${Object.entries(filter).map(([key, value]) => `${key}=${value}`).join('&')}`;
      }
      console.log('Making API call to:', url);
      console.log('Environment systemMode:', environment.systemMode);
      console.log('Environment apiUrl:', environment.apiUrl);
      
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
        }),
        catchError(error => {
          console.error('API Error:', error);
          console.error('Error details:', error.message);
          console.error('Error status:', error.status);
          throw error;
        })
      );
    }
  }

  deleteOrder(id: string): Observable<ApiResponse<Cart>> {
      if (environment.systemMode == 2) { // OffLine mode - use Firebase
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
    if (environment.systemMode == 2) { // OffLine mode - use Firebase
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

  /**
   * Save order as draft - Always use API regardless of system mode
   */
  saveDraftOrder(data: Cart): Observable<ApiResponse<Cart>> {
    const draftData = {
      ...data,
      isDraft: true,
      // Don't force orderStatus to 'draft', keep existing status or let it be undefined
      orderStatus: data.orderStatus || undefined,
      updatedAt: new Date()
    };
    
    // Always use API for draft orders, regardless of system mode
    const cleanData = this.createCleanCart(draftData);
    return this.http.post<ApiResponse<Cart>>(`${environment.apiUrl}api/orders`, cleanData);
  }

  /**
   * Get all draft orders - Always use API regardless of system mode
   */
  getDraftOrders(): Observable<ApiResponse<Cart[]>> {
    const filter: Filter = {
      pageNumber: 1,
      pageSize: 100,
      name: ''
      // Remove orderStatus filter since we're not always setting it to 'draft'
    };
    
    // Always use API for draft orders, regardless of system mode
    let url = `${environment.apiUrl}api/orders`;
    if(filter) { 
      url = `${url}?${Object.entries(filter).map(([key, value]) => `${key}=${value}`).join('&')}`;
    }
    return this.http.get<{success: boolean, message: string, data: ApiOrderResponse}>(`${url}`).pipe(
      map(response => {
        console.log('Raw API response for drafts:', response);
        console.log('API response data:', response.data);
        console.log('API response items:', response.data.items);
        
        const transformedData = response.data.items.map(apiOrder => this.transformApiOrderToCart(apiOrder));
        console.log('Transformed draft data:', transformedData);
        
        // Filter for draft orders in frontend based on isDraft flag
        const draftOrders = transformedData.filter(order => order.isDraft === true);
        
        return {
          data: draftOrders,
          message: response.message,
          success: response.success,
          totalCount: draftOrders.length
        };
      })
    );
  }

  /**
   * Convert draft order to completed order
   */
  completeDraftOrder(draftId: string, paymentData: any): Observable<ApiResponse<Cart>> {
    // First get the draft order
    return this.getAllOrders().pipe(
      switchMap(response => {
        if (response.success && response.data) {
          const draftOrder = response.data.find(order => order.id === draftId);
          if (draftOrder) {
            const completedOrder = {
              ...draftOrder,
              isDraft: false,
              orderStatus: 'completed',
              paymentMethod: paymentData.paymentMethod,
              customerName: paymentData.customerName,
              notes: paymentData.notes,
              updatedAt: new Date()
            };
            return this.saveOrder(completedOrder);
          }
        }
        throw new Error('Draft order not found');
      })
    );
  }

  /**
   * Delete draft order - Always use API regardless of system mode
   */
  deleteDraftOrder(draftId: string): Observable<ApiResponse<Cart>> {
    // Always use API for draft orders, regardless of system mode
    return this.http.delete<ApiResponse<Cart>>(`${environment.apiUrl}api/orders/${draftId}`);
  }

  /**
   * Restore draft order to cart
   */
  restoreDraftToCart(draftId: string): Observable<ApiResponse<Cart>> {
    return this.getAllOrders().pipe(
      map(response => {
        if (response.success && response.data) {
          const draftOrder = response.data.find(order => order.id === draftId);
          if (draftOrder) {
            return {
              data: draftOrder,
              message: 'Draft order restored to cart',
              success: true
            };
          }
        }
        throw new Error('Draft order not found');
      })
    );
  }
}
