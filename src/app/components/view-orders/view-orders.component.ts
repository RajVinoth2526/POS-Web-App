import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ApiResponse, Cart, Filter } from 'src/app/model/system.model';
import { OrderService } from 'src/app/service/order.service';
import { ProductService } from 'src/app/service/product.service';
import { SystemService } from 'src/app/service/system.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'app-view-orders',
  templateUrl: './view-orders.component.html',
  styleUrls: ['./view-orders.component.css']
})
export class ViewOrdersComponent implements OnInit, OnDestroy {
  searchQuery: string = '';
  filteredProducts: any[] = [];
  searchType: string = ''; // default to 'name'
  displayedColumns: string[] = ['orderId', 'customerName', 'orderDate', 'totalAmount', 'details'];
  carts: Cart[] = [];
  currency: string = '';
  searchInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private orderService: OrderService,
    private spinnerService: NgxSpinnerService,
    private systemService: SystemService,
    private productService: ProductService
  ) { }

  // Order details array
  ngOnInit(): void {

    this.searchInput$
      .pipe(
        debounceTime(1000), // Wait 300ms after typing stops
        distinctUntilChanged(),
        takeUntil(this.destroy$),
        switchMap((query: string) => {
          const filter: Filter = {};

          if (this.searchType === 'id' && query) {
            filter['orderId'] = query;
          } else if (this.searchType === 'date' && query) {
            filter['cartDate'] = query;
          } else if (query && this.isNumeric(query)) {
            filter['orderId'] = query;
          }

          const observable = !query
            ? this.orderService.getAllOrders()
            : this.orderService.getAllOrders(filter);

          this.spinnerService.show();
          return observable;
        })
      )
      .subscribe({
        next: (response: ApiResponse<any[]>) => {
          this.spinnerService.hide();
          this.carts = response.data;
        },
        error: () => {
          this.spinnerService.hide();
        }
      });

    this.currency = this.systemService.getCurrencyValue() ?? '';
    this.spinnerService.show();
    this.orderService.getAllOrders().subscribe((response: any) => {
      const typedResponse = response as ApiResponse<Cart[]>;
      this.spinnerService.hide();
      this.carts = typedResponse.data;
    }, (error: any) => {
      this.spinnerService.hide();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchType = ''; // Reset to default search type
    this.onSearch();
  }


  onSliderChange(order: any, value: number | null) {
    order.itemsVisible = !!value && value > 0;
  }

  isNumeric(value: string): boolean {
    return !isNaN(Number(value.trim()));
  }

  onSearch(): void {
    const query = this.searchQuery?.toLowerCase().trim();
    this.searchInput$.next(query);
  }




}
