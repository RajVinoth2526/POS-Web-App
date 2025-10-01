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
  filteredCarts: Cart[] = [];
  currency: string = '';
  searchInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  // Order status filter
  orderStatusFilter: string = ''; // 'draft', 'pending', 'completed', etc.
  
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
        debounceTime(1000), // Wait 1000ms after typing stops
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
          
          // Since we're filtering via API, set filteredCarts to the same as carts
          this.filteredCarts = this.carts;
          
          console.log('🔍 Search results loaded via API:', this.filteredCarts.length, 'orders');
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
    console.log('getOrder() called with filter:', this.filter);
    this.spinnerService.show();
    this.orderService.getAllOrders(this.filter).subscribe((response: any) => {
      const typedResponse = response as ApiResponse<Cart[]>;
      this.spinnerService.hide();
      console.log('Orders response:', typedResponse);
      console.log('Orders data:', typedResponse.data);
      
      this.carts = typedResponse.data ?? [];
      this.totalCount = typedResponse.totalCount ?? 0;
      
      // Since we're filtering via API, set filteredCarts to the same as carts
      this.filteredCarts = this.carts;
      
      console.log('Carts after assignment:', this.carts);
      console.log('Filtered carts:', this.filteredCarts);
      console.log('Total count:', this.totalCount);
      
      // Detailed logging for each order to debug status issues
      console.log('🔍 DETAILED ORDER STATUS DEBUG:');
      this.carts.forEach((order, index) => {
        console.log(`Order ${index + 1}:`, {
          orderId: order.orderId,
          isDraft: order.isDraft,
          orderStatus: order.orderStatus,
          isDraftType: typeof order.isDraft,
          orderStatusType: typeof order.orderStatus,
          rawOrder: order
        });
      });
      
      // Log orders by status for debugging
      const draftOrders = this.carts.filter(order => order.isDraft === true);
      const completedOrders = this.carts.filter(order => order.orderStatus === 'completed');
      const pendingOrders = this.carts.filter(order => order.orderStatus === 'Pending');
      
      console.log('📊 Orders by status:');
      console.log('  - Draft orders:', draftOrders.length);
      console.log('  - Completed orders:', completedOrders.length);
      console.log('  - Pending orders:', pendingOrders.length);
      
    }, (error: any) => {
      this.spinnerService.hide();
      console.error('Error fetching orders:', error);
      console.error('Error status:', error.status);
      console.error('Error message:', error.message);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle changes to filteredOrders input
    if (changes['filteredOrders']) {
      if (changes['filteredOrders'].currentValue && changes['filteredOrders'].currentValue.length > 0) {
        this.carts = changes['filteredOrders'].currentValue;
        this.totalCount = changes['filteredOrders'].currentValue.length;
        console.log('Filtered orders received, applying filters...');
        this.applyFilters(); // Apply filters when filtered orders are provided
      } else {
        this.carts = [];
        this.totalCount = 0;
        this.filteredCarts = [];
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
    
    console.log('Updated filter with search:', this.filter);
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
    console.log('onSearch() called');
    // Trigger API search with current query
    if (this.searchQuery && this.searchType) {
      this.searchInput$.next(this.searchQuery);
    } else {
      // If no search query, apply filters without search
      this.applyFilters();
    }
  }

  deleteOrder(cart: Cart) {
    const isDraft = this.isDraftOrder(cart);
    const orderType = isDraft ? 'draft order' : 'order';
    
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '500px',
      disableClose: true,
      data: {
        id: cart.id,
        title: 'Delete Order',
        message: `Are you sure you want to delete this ${orderType}? This action cannot be undone.`,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog result:', result);
      if (result) {
        console.log(`🗑️ Deleting ${orderType}:`, cart.orderId);
        this.spinnerService.show();
        this.orderService.deleteOrder(cart.id ?? '').subscribe((response: any) => {
          this.spinnerService.hide();
          console.log(`✅ ${orderType} deleted successfully`);
          this.getOrder(); // Refresh the order list
        }, (error: any) => {
          this.spinnerService.hide();
          console.error(`❌ Error deleting ${orderType}:`, error);
        });
      }
    });
  }


  viewProduct(cartItem: CartItem) {
    this.router.navigate(['/edit-product', cartItem.productId || cartItem.product.id]);
  }

  /**
   * Apply filters to orders by calling API with filters
   */
  applyFilters(): void {
    console.log('=== APPLYING FILTERS VIA API ===');
    console.log('orderStatusFilter:', this.orderStatusFilter);
    console.log('searchQuery:', this.searchQuery);
    console.log('searchType:', this.searchType);

    // Update the filter object with current selections
    this.updateApiFilter();
    
    // Call API with updated filters
    this.getOrder();
  }

  /**
   * Update the API filter object based on current UI selections
   */
  updateApiFilter(): void {
    // Reset filter to defaults
    this.filter = {
      pageNumber: 1,
      pageSize: 10,
      name: ''
    };

    // Apply status filter
    if (this.orderStatusFilter) {
      if (this.orderStatusFilter === 'draft') {
        // For draft filter, send orderStatus as "draft" (lowercase) to match API data
        this.filter.orderStatus = 'draft';
        console.log('🔍 API Filter: orderStatus = "draft"');
      } else if (this.orderStatusFilter === 'Pending') {
        // For pending filter, send orderStatus as "Pending" (capital P) to match API data
        this.filter.orderStatus = 'Pending';
        console.log('🔍 API Filter: orderStatus = "Pending"');
      } else {
        // For other statuses (completed, cancelled), use as-is
        this.filter.orderStatus = this.orderStatusFilter;
        console.log('🔍 API Filter: orderStatus =', this.orderStatusFilter);
      }
    }

    // Apply search filter
    if (this.searchQuery && this.searchType) {
      if (this.searchType === 'id') {
        this.filter.orderNumber = this.searchQuery;
        console.log('🔍 API Filter: orderNumber =', this.searchQuery);
      } else if (this.searchType === 'date') {
        // Create start and end time for the selected date
        this.filter.orderStartDate = `${this.searchQuery}T00:00:00.000Z`;
        this.filter.orderEndDate = `${this.searchQuery}T23:59:59.999Z`;
        console.log('🔍 API Filter: date range =', this.filter.orderStartDate, 'to', this.filter.orderEndDate);
      }
    }

    console.log('📋 Final API Filter:', this.filter);
  }


  /**
   * Handle status filter change
   */
  onStatusFilterChange(): void {
    console.log('🔄 STATUS FILTER CHANGED');
    console.log('New status filter:', this.orderStatusFilter);
    this.applyFilters();
  }

  /**
   * Restore draft order to cart and navigate to sales screen
   */
  restoreDraftToCart(draftOrder: Cart): void {
    if (!draftOrder.id) {
      alert('Invalid draft order');
      return;
    }

    console.log('🔄 Restoring draft order to cart:', draftOrder);
    this.spinnerService.show();
    
    this.orderService.restoreDraftToCart(draftOrder.id).subscribe({
      next: (response: ApiResponse<Cart>) => {
        this.spinnerService.hide();
        if (response.success && response.data) {
          console.log('✅ Draft order restored successfully:', response.data);
          
          // Update the product service cart with the restored draft
          this.productService.updateCart(response.data);
          
          // Navigate to sales order process page
          console.log('🧭 Navigating to sales order process...');
          this.router.navigate(['/sales-order-process']);
        } else {
          alert('Failed to restore draft order: ' + response.message);
        }
      },
      error: (error) => {
        this.spinnerService.hide();
        console.error('Error restoring draft order:', error);
        alert('Error restoring draft order. Please try again.');
      }
    });
  }

  /**
   * Complete draft order (convert to completed order)
   */
  completeDraftOrder(draftOrder: Cart): void {
    if (!draftOrder.id) {
      alert('Invalid draft order');
      return;
    }

    // You can add a dialog here to collect payment information
    const paymentData = {
      paymentMethod: 'cash', // Default payment method
      customerName: draftOrder.customerName || '',
      notes: draftOrder.notes || ''
    };

    this.spinnerService.show();
    this.orderService.completeDraftOrder(draftOrder.id, paymentData).subscribe({
      next: (response: ApiResponse<Cart>) => {
        this.spinnerService.hide();
        if (response.success) {
          alert('Draft order completed successfully!');
          this.getOrder(); // Refresh the list
        } else {
          alert('Failed to complete draft order: ' + response.message);
        }
      },
      error: (error) => {
        this.spinnerService.hide();
        console.error('Error completing draft order:', error);
        alert('Error completing draft order. Please try again.');
      }
    });
  }

  /**
   * Check if order is a draft
   */
  isDraftOrder(order: Cart): boolean {
    return order.isDraft === true;
  }

  /**
   * Get order status badge class with better visibility
   */
  getStatusBadgeClass(order: Cart): string {
    if (order.isDraft) return 'badge-warning text-dark fw-bold';
    
    const status = order.orderStatus?.toLowerCase() || 'pending';
    switch (status) {
      case 'completed': return 'badge-success text-white fw-bold';
      case 'pending': return 'badge-primary text-white fw-bold';
      case 'cancelled': return 'badge-danger text-white fw-bold';
      case 'draft': return 'badge-warning text-dark fw-bold';
      default: return 'badge-secondary text-white fw-bold';
    }
  }

  /**
   * Get order status text with proper fallback
   */
  getStatusText(order: Cart): string {
    // Debug logging
    console.log(`🔍 Order ${order.orderId} status debug:`, {
      isDraft: order.isDraft,
      orderStatus: order.orderStatus,
      type: typeof order.orderStatus
    });
    
    // Check if it's a draft order first
    if (order.isDraft === true) {
      return 'Draft';
    }
    
    // Return the actual orderStatus, or 'Pending' as fallback
    const status = order.orderStatus;
    if (status) {
      // Capitalize first letter for better display
      return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
    
    return 'Pending';
  }


}
