import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { ApiResponse, Cart, Filter, PagedResult, Product, Profile } from '../model/system.model';
import { environment } from 'src/environments/environment';
import { ProductService as FirebaseProductService } from '../firebase/fire-servie/product.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private cartSubject = new BehaviorSubject<Cart | null>(null);
  cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient,
    private firebaseProductService: FirebaseProductService
  ) { }


  updateCartValue(settings: Cart) {
    this.cartSubject.next(settings);
  }

  getCurrentCartValue(): Cart | null {
    return this.cartSubject.value;
  }

  // Method to insert a new product
  addProduct(product: Product): Observable<Product> {
    if (environment.systemMode == 1) {
      return this.firebaseProductService.addProduct(product);
    } else {
      return this.http.post<Product>(`${environment.apiUrl}api/products`, product);
    }
  }

  // getAllProfile
  getAllProducts(filter?: Filter): Observable<PagedResult<Product>> {
    // if (environment.systemMode == 1) {
      // return this.firebaseProductService.getAllProducts(filter).pipe(
    //     map((products: Product[]) => ({
    //       data: products,
    //       message: 'Success',
    //       success: true
    //     }))
    //   );
    // } else {
      
      let params = filter ? new HttpParams().set('name', filter['name'] || '') : undefined;
      if(params) {
        params = params
        .set('pageNumber', filter && filter['pageNumber']?.toString() || '1')
        .set('pageSize', filter && filter['pageSize']?.toString() || '10');  
      }
      
      return this.http.get<PagedResult<Product>>(`${environment.apiUrl}api/products`, { params });
      
    // }
  }
  // GET: Get theme settings by ID
  getProduct(id: string): Observable<ApiResponse<Product>> {
    if (environment.systemMode == 1) {
      return this.firebaseProductService.getProductById(id.toString()).pipe(
        map((product): ApiResponse<Product> => {
          if (!product) {
            throw new Error('Product not found');
          }
          return {
            data: product,
            message: 'Success',
            success: true
          };
        })
      );
    } else {
      return this.http.get<ApiResponse<Product>>(`${environment.apiUrl}api/products/${id}`);
    }
  }


  updateProduct(id: string, data: Partial<Product>): Observable<ApiResponse<Product>> {
    if (environment.systemMode == 1) {
      return this.firebaseProductService.updateProduct(id.toString(), data).pipe(
        map((product: Product) => ({
          data: product,
          message: 'Success',
          success: true
        }))
      );
    } else {
      return this.http.patch<ApiResponse<Product>>(`${environment.apiUrl}api/products/${id}`, data);
    }
  }

  deleteProduct(id: string): Observable<ApiResponse<Product>> {
    if (environment.systemMode == 1) {
      return this.firebaseProductService.deleteProductById(id.toString()).pipe(
        map(() => ({
          data: null, // this is allowed only if ApiResponse<Product> accepts null
          message: 'Product deleted successfully',
          success: true
        }))
      );
    } else {
      return this.http.delete<ApiResponse<Product>>(`${environment.apiUrl}api/products/${id}`);
    }
  }
  
}
