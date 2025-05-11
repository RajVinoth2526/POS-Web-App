import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiResponse, Cart, Filter, Product, Profile } from '../model/system.model';
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
  getAllProducts(filter?: Filter): Observable<ApiResponse<Product[]>> {
    if (environment.systemMode == 1) {
      return this.firebaseProductService.getAllProducts(filter).pipe(
        map((products: Product[]) => ({
          data: products,
          message: 'Success',
          success: true
        }))
      );
    } else {
      return this.http.get<ApiResponse<Product[]>>(`${environment.apiUrl}api/products`);
    }
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

}
