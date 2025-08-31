import { Component, OnDestroy, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ApiResponse, Cart, CartItem, Filter } from 'src/app/model/system.model';
import { OrderService } from 'src/app/service/order.service';
import { ProductService } from 'src/app/service/product.service';
import { SystemService } from 'src/app/service/system.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationComponent } from '../confirmation/confirmation.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-view-orders',
  templateUrl: './view-orders.component.html',
  styleUrls: ['./view-orders.component.css']
})
export class ViewOrdersComponent implements OnInit, OnDestroy, OnChanges {
  @Input() filteredOrders: Cart[] = [];
  @Input() dateFilter: Filter | null = null;
  @Input() hideDatePicker: boolean = false;
  
  searchQuery: string = '';
  filteredProducts: any[] = [];
  searchType: string = ''; // default to 'name'
  displayedColumns: string[] = ['orderId', 'customerName', 'orderDate', 'totalAmount', 'details'];
  carts: Cart[] = [];
  currency: string = '';
  searchInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  // Pagination properties
  totalCount: number = 0;
  filter: Filter = {
    pageNumber: 1,
    pageSize: 10,
    name: ''
  };

  constructor(private orderService: OrderService,
    private spinnerService: NgxSpinnerService,
    private systemService: SystemService,
    private productService: ProductService,
    private dialog: MatDialog,
    private router: Router,

  ) { }

  // Order details array
  ngOnInit(): void {
    this.currency = this.systemService.getCurrencyValue() ?? '';
    
    // Check if we have filtered orders from parent component
    if (this.filteredOrders && this.filteredOrders.length > 0) {
      this.carts = this.filteredOrders;
      this.totalCount = this.filteredOrders.length;
      return; // Skip normal initialization if using filtered orders
    }
    
    // Check if we have a date filter from parent component
    if (this.dateFilter) {
      this.filter = { ...this.dateFilter };
    }

    this.searchInput$
      .pipe(
        debounceTime(1000), // Wait 300ms after typing stops
        distinctUntilChanged(),
        takeUntil(this.destroy$),
        switchMap((query: string) => {
          // Update filter with search parameters
          this.updateFilterWithSearch(query);

          const observable = this.orderService.getAllOrders(this.filter);

          this.spinnerService.show();
          return observable;
        })
      )
      .subscribe({
        next: (response: ApiResponse<any[]>) => {
          this.spinnerService.hide();
          this.carts = response.data ?? [];
          this.totalCount = response.totalCount ?? 0;
        },
        error: () => {
          this.spinnerService.hide();
        }
      });

    // Initial data load - only if we don't have filtered orders
    if (!this.filteredOrders || this.filteredOrders.length === 0) {
      this.getOrder();
    }
  }

  getOrder() {
    this.spinnerService.show();
    this.orderService.getAllOrders(this.filter).subscribe((response: any) => {
      const typedResponse = response as ApiResponse<Cart[]>;
      this.spinnerService.hide();
      console.log('Orders response:', typedResponse);
      console.log('Orders data:', typedResponse.data);
      this.carts = typedResponse.data ?? [];
      this.totalCount = typedResponse.totalCount ?? 0;
      console.log('Carts after assignment:', this.carts);
      console.log('Total count:', this.totalCount);
    }, (error: any) => {
      this.spinnerService.hide();
      console.error('Error fetching orders:', error);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle changes to filteredOrders input
    if (changes['filteredOrders']) {
      if (changes['filteredOrders'].currentValue && changes['filteredOrders'].currentValue.length > 0) {
        this.carts = changes['filteredOrders'].currentValue;
        this.totalCount = changes['filteredOrders'].currentValue.length;
      } else {
        this.carts = [];
        this.totalCount = 0;
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateFilterWithSearch(query: string) {
    // Reset pagination when searching
    this.filter.pageNumber = 1;
    
    // Clear previous search filters
    delete this.filter.orderNumber;
    delete this.filter.orderStartDate;
    delete this.filter.orderEndDate;
    delete this.filter.orderDate;

    if (this.searchType === 'id' && query) {
      this.filter.orderNumber = query;
    } else if (this.searchType === 'date' && query) {
      // Create start and end time for the selected date
      this.filter.orderStartDate = `${query}T00:00:00.000Z`;  // Start of day in UTC
      this.filter.orderEndDate = `${query}T23:59:59.999Z`;    // End of day in UTC
    } else if (query) {
      this.filter.orderNumber = query;
    }
  }

  onPageChange(event: { pageNumber: number, pageSize: number }) {
    this.filter.pageNumber = event.pageNumber;
    this.filter.pageSize = event.pageSize;
    this.getOrder();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchType = ''; // Reset to default search type
    this.filter.pageNumber = 1; // Reset to first page
    this.onSearch();
  }




  isNumeric(value: string): boolean {
    return !isNaN(Number(value.trim()));
  }

  onSearch(): void {
    const query = this.searchQuery?.toLowerCase().trim();
    this.searchInput$.next(query);
  }

  deleteOrder(cart: Cart) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '500px',
      height: '200px',
      disableClose: true,
      data: {
        id: cart.id,
        title: 'Delete Order',
        message: 'Are you sure you want to delete this order?',
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog result:', result);
      if (result) {
        this.spinnerService.show();
        this.orderService.deleteOrder(cart.id ?? '').subscribe((response: any) => {
          this.spinnerService.hide();
          this.getOrder();
        }, (error: any) => {
          this.spinnerService.hide();
        });
      }
    });
  }


  viewProduct(cartItem: CartItem) {
    this.router.navigate(['/edit-product', cartItem.productId || cartItem.product.id]);
  }

}
