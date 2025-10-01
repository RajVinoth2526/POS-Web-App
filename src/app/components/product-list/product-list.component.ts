import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgxSpinner } from 'ngx-spinner/lib/ngx-spinner.enum';
import { ApiResponse, Filter, PagedResult } from 'src/app/model/system.model';
import { ProductService } from 'src/app/service/product.service';
import { Product } from 'src/app/model/system.model';
import { SystemService } from 'src/app/service/system.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { ConfirmationComponent } from '../confirmation/confirmation.component';
import { MatDialog } from '@angular/material/dialog';
import { title } from 'process';
import { AddProductPopupComponent } from '../add-product-popup/add-product-popup.component';
@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit, OnDestroy, OnChanges {
  products: Product[] = [];
  currency: string = '';
  searchQuery: string = '';
  selectedCategory: string = '';
  totalCount: number = 0;
  filteredProducts: any[] = [];
  productSearch$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  categories = [
    { value: 'cakes', label: 'Cakes' },
    { value: 'sweets', label: 'Sweets' },
    { value: 'milkshakes', label: 'Milk Shakes' },
    { value: 'beverages', label: 'Beverages' },
    { value: 'juice', label: 'Juice' },
    { value: 'snacks', label: 'Snacks' },
    { value: 'dairy', label: 'Dairy Products' },
    { value: 'bakery', label: 'Bakery Items' },
    { value: 'frozen', label: 'Frozen Foods' },
    { value: 'canned', label: 'Canned Goods' },
    { value: 'spices', label: 'Spices & Seasonings' },
    { value: 'beverages_hot', label: 'Hot Beverages' },
    { value: 'beverages_cold', label: 'Cold Beverages' },
    { value: 'confectionery', label: 'Confectionery' },
    { value: 'health_food', label: 'Health Food' }
  ];
  filter: Filter = {
    pageNumber: 1,
    pageSize: 20,
    name: ''
  };
  
  @Output() add = new EventEmitter<any>();
  @Input() isViewStyleTable: boolean = false;
  @Input() isFromProductViews: boolean = false;
  @Input() externalSearchQuery: string = '';
  @Input() externalCategory: string = '';
  @Input() externalSortBy: string = '';

  constructor(private productService: ProductService,
    private systemService: SystemService,
    private spinnerService: NgxSpinnerService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.getProducts(this.filter);
  }
  ngOnInit(): void {

    this.productSearch$
    .pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
      switchMap((query: string) => {
        if (query != null) {
          this.filter.name = query;
        }
        // Preserve category filter when searching
        this.filter.category = this.selectedCategory || '';

        const observable =  this.productService.getAllProducts(this.filter);

        this.spinnerService.show();
        return observable;
      })
    )
    .subscribe({
      next: (response: any) => {
        this.spinnerService.hide();
        this.products = response['data']?.items ?? [];
        this.totalCount = response['data']?.totalCount ?? 0;
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['externalSearchQuery'] && this.isFromProductViews) {
      this.onExternalSearch();
    }
  }

  onPageChange(event: { pageNumber: number, pageSize: number }) {
    this.filter.pageNumber = event.pageNumber;
    this.filter.pageSize = event.pageSize;
    this.filter.name = this.searchQuery?.trim().toLowerCase();
    this.getProducts(this.filter);
  }

  getProducts(filter?: Filter): void {
    this.spinnerService.show();  // Make sure you're showing the spinner before the request.

    this.productService.getAllProducts(filter)
      .subscribe((response: any) => {
        const typedResponse = response as any;
        this.spinnerService.hide();
        this.products = typedResponse['data']?.items ?? [];
        this.totalCount = response['data']?.totalCount ?? 0;
      }, (error: any) => {
        this.spinnerService.hide();
      });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.filter.pageNumber = 1;
    this.filter.pageSize = 20;
    this.filter.category = '';
    this.onSearch();
  }

  addToCart(product: Product) {
    const dialogRef = this.dialog.open(AddProductPopupComponent, {
      width: '500px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'add-product-dialog',
      disableClose: false,
      data: {
        product: product,
        title: 'Add Product',
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog result:', result);
      if (result) {
        this.add.emit(result);     
      }
    });
  }

  onSearch(): void {
    const query = this.searchQuery?.trim().toLowerCase();
    this.productSearch$.next(query);
  }

  onCategoryFilter(): void {
    this.filterProducts();
  }

  filterProducts(): void {
    this.filter.category = this.selectedCategory || '';
    this.filter.pageNumber = 1;
    // Call API immediately when category is selected
    this.getProducts(this.filter);
  }

  // Handle external search from view-products component
  onExternalSearch(): void {
    if (this.isFromProductViews) {
      this.searchQuery = this.externalSearchQuery;
      this.filter.name = this.externalSearchQuery?.trim().toLowerCase();
      this.filter.pageNumber = 1;
      this.getProducts(this.filter);
    }
  }
  

  editProduct(productId: string) {
    this.router.navigate(['/edit-product', productId]);
  }

  OnDelete(productId: string) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '500px',
      disableClose: true,
      data: {
        id: productId,
        title: 'Delete Product',
        message: 'Are you sure you want to delete this product?',
      },
    });

      dialogRef.afterClosed().subscribe(result => {
        console.log('Dialog result:', result);
        if (result) {
          this.spinnerService.show();
          this.productService.deleteProduct(productId).subscribe((response: any) => {
            this.spinnerService.hide();
            this.getProducts();
          }, (error: any) => {
            this.spinnerService.hide();
          });
        }
      });
  }

}
