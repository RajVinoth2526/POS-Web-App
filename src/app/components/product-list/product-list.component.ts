import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
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
export class ProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  currency: string = '';
  searchQuery: string = '';
  totalCount: number = 0;
  filteredProducts: any[] = [];
  productSearch$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  filter: Filter = {
    pageNumber: 1,
    pageSize: 20,
    name: ''
  };
  
  @Output() add = new EventEmitter<any>();
  @Input() isViewStyleTable: boolean = false;
  @Input() isFromProductViews: boolean = false;

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
    this.filter.pageNumber = 1;
    this.filter.pageSize = 20;
    this.onSearch();
  }

  addToCart(product: Product) {
    const dialogRef = this.dialog.open(AddProductPopupComponent, {
      width: '50%',
      height: 'auto',
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
  

  editProduct(productId: string) {
    this.router.navigate(['/edit-product', productId]);
  }

  OnDelete(productId: string) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '500px',
      height: 'auto',
      disableClose: true ,
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
