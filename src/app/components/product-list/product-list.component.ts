import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgxSpinner } from 'ngx-spinner/lib/ngx-spinner.enum';
import { ApiResponse, Filter } from 'src/app/model/system.model';
import { ProductService } from 'src/app/service/product.service';
import { Product } from 'src/app/model/system.model';
import { SystemService } from 'src/app/service/system.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  currency: string = '';
  searchQuery: string = '';
  filteredProducts: any[] = [];
  productSearch$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  @Output() add = new EventEmitter<any>();
  @Input() isViewStyleTable: boolean = false;
  @Input() isFromProductViews: boolean = false;

  constructor(private productService: ProductService,
    private systemService: SystemService,
    private spinnerService: NgxSpinnerService,
    private router: Router
  ) {
    this.getProducts();
  }
  ngOnInit(): void {

    this.productSearch$
    .pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
      switchMap((query: string) => {
        const filter: Filter = {};
        if (query) {
          filter['lowerCaseName'] = query;
        }

        const observable = !query
          ? this.productService.getAllProducts()
          : this.productService.getAllProducts(filter);

        this.spinnerService.show();
        return observable;
      })
    )
    .subscribe({
      next: (response: ApiResponse<any[]>) => {
        this.spinnerService.hide();
        this.products = response.data;
      },
      error: () => {
        this.spinnerService.hide();
      }
    });

    this.currency = this.systemService.getCurrencyValue() ?? '';

  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getProducts() {
    this.spinnerService.show();  // Make sure you're showing the spinner before the request.

    this.productService.getAllProducts()
      .subscribe((response: any) => {
        const typedResponse = response as ApiResponse<Product[]>;
        this.spinnerService.hide();
        this.products = typedResponse.data;
      }, (error: any) => {
        this.spinnerService.hide();
      });
  }




  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch();
  }

  addToCart(product: Product) {
    this.add.emit(product);
  }

  onSearch(): void {
    const query = this.searchQuery?.trim().toLowerCase();
    this.productSearch$.next(query);
  }
  

  editProduct(productId: string) {
    this.router.navigate(['/edit-product', productId]);
  }

}
