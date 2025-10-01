import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Product, Filter, ApiResponse, PagedResult } from 'src/app/model/system.model';
import { ProductService } from 'src/app/service/product.service';
import { SystemService } from 'src/app/service/system.service';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Router } from '@angular/router';

interface InventoryItem {
  product: Product;
  currentStock: number;
  lowStockThreshold: number;
  reorderPoint: number;
  lastUpdated: Date;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  stockValue: number;
}

interface InventoryStats {
  totalProducts: number;
  totalStockValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  averageStockLevel: number;
}

@Component({
  selector: 'app-inventory-management',
  templateUrl: './inventory-management.component.html',
  styleUrls: ['./inventory-management.component.css']
})
export class InventoryManagementComponent implements OnInit, OnDestroy {
  // Make Math available in template
  Math = Math;
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  // Data
  inventoryItems: InventoryItem[] = [];
  filteredItems: InventoryItem[] = [];
  stats: InventoryStats = {
    totalProducts: 0,
    totalStockValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    averageStockLevel: 0
  };

  // Search and filters
  searchQuery: string = '';
  filterStatus: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock' = 'all';
  sortBy: 'name' | 'stock' | 'value' | 'lastUpdated' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  // UI state
  isLoading: boolean = false;
  currency: string = '';
  showLowStockOnly: boolean = false;
  selectedItems: string[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  constructor(
    private productService: ProductService,
    private systemService: SystemService,
    private spinnerService: NgxSpinnerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.currency = this.systemService.getCurrencyValue() ?? '';
    console.log('Component initialized with filter values:', {
      searchQuery: this.searchQuery,
      filterStatus: this.filterStatus,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    });
    
    // Setup search with debounce
    this.searchSubject$
      .pipe(
        debounceTime(500), // Wait 500ms after user stops typing
        distinctUntilChanged(), // Only emit if value changed
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        console.log('Search term after debounce:', searchTerm);
        this.searchQuery = searchTerm;
        this.loadInventoryDataWithFilters();
      });
    
    this.loadInventoryData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInventoryData(): void {
    this.isLoading = true;
    this.spinnerService.show();

    console.log('Loading inventory data...');
    this.productService.getAllProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        console.log('Product API response:', response);
        
        // Handle different response structures
        let products: Product[] = [];
        if (response && response.items) {
          // Direct PagedResult structure
          products = response.items;
        } else if (response && response.data && response.data.items) {
          // Wrapped in ApiResponse structure
          products = response.data.items;
        } else if (Array.isArray(response)) {
          // Direct array
          products = response;
        }
        
        console.log('Products array:', products);
        this.inventoryItems = products.map((product: Product) => this.createInventoryItem(product));
        console.log('Inventory items:', this.inventoryItems);
        console.log('Calling calculateStats...');
        this.calculateStats();
        console.log('Calling applyFilters...');
        this.applyFilters();
        this.isLoading = false;
        this.spinnerService.hide();
      }, (error) => {
        console.error('Error loading inventory data:', error);
        this.isLoading = false;
        this.spinnerService.hide();
      });
  }

  loadInventoryDataWithFilters(): void {
    this.isLoading = true;
    this.spinnerService.show();

    console.log('Loading inventory data with filters...');
    console.log('Filter parameters:', {
      searchQuery: this.searchQuery,
      filterStatus: this.filterStatus,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      pageNumber: this.currentPage,
      pageSize: this.itemsPerPage
    });

    // Create filter object for API call
    const filter: Filter = {
      pageNumber: this.currentPage,
      pageSize: this.itemsPerPage,
      name: this.searchQuery || ''
    };

    this.productService.getAllProducts(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        console.log('Filtered API response:', response);
        
        // Handle different response structures
        let products: Product[] = [];
        if (response && response.items) {
          // Direct PagedResult structure
          products = response.items;
        } else if (response && response.data && response.data.items) {
          // Wrapped in ApiResponse structure
          products = response.data.items;
        } else if (Array.isArray(response)) {
          // Direct array
          products = response;
        }
        
        console.log('Filtered products array:', products);
        this.inventoryItems = products.map((product: Product) => this.createInventoryItem(product));
        console.log('Updated inventory items:', this.inventoryItems);
        
        // Apply local filters for status and sorting
        this.applyLocalFilters();
        
        this.isLoading = false;
        this.spinnerService.hide();
      }, (error) => {
        console.error('Error loading filtered inventory data:', error);
        this.isLoading = false;
        this.spinnerService.hide();
      });
  }

  private createInventoryItem(product: Product): InventoryItem {
    console.log('Creating inventory item for product:', product);
    const currentStock = product.stockQuantity || 0;
    const lowStockThreshold = product['lowStockThreshold'] || 10;
    const reorderPoint = product['reorderPoint'] || 5;
    const stockValue = currentStock * (product.price || 0);

    let stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
    if (currentStock === 0) {
      stockStatus = 'Out of Stock';
    } else if (currentStock <= lowStockThreshold) {
      stockStatus = 'Low Stock';
    } else {
      stockStatus = 'In Stock';
    }

    const inventoryItem = {
      product,
      currentStock,
      lowStockThreshold,
      reorderPoint,
      lastUpdated: new Date(),
      stockStatus,
      stockValue
    };
    
    console.log('Created inventory item:', inventoryItem);
    console.log('Stock status determined as:', stockStatus);
    return inventoryItem;
  }

  private calculateStats(): void {
    this.stats = {
      totalProducts: this.inventoryItems.length,
      totalStockValue: this.inventoryItems.reduce((sum, item) => sum + item.stockValue, 0),
      lowStockItems: this.inventoryItems.filter(item => item.stockStatus === 'Low Stock').length,
      outOfStockItems: this.inventoryItems.filter(item => item.stockStatus === 'Out of Stock').length,
      averageStockLevel: this.inventoryItems.length > 0 
        ? this.inventoryItems.reduce((sum, item) => sum + item.currentStock, 0) / this.inventoryItems.length 
        : 0
    };
  }

  applyFilters(): void {
    console.log('Applying all filters (including search)...');
    this.applyLocalFilters();
  }

  private applyLocalFilters(): void {
    console.log('Applying local filters only...');
    console.log('Current inventory items:', this.inventoryItems.length);
    console.log('Filter status:', this.filterStatus);
    console.log('Sort by:', this.sortBy);
    console.log('Sort order:', this.sortOrder);

    let filtered = [...this.inventoryItems];

    // Apply status filter (local filtering only)
    if (this.filterStatus !== 'all') {
      console.log('Applying status filter for:', this.filterStatus);
      filtered = filtered.filter(item => {
        switch (this.filterStatus) {
          case 'in-stock':
            return item.stockStatus === 'In Stock';
          case 'low-stock':
            return item.stockStatus === 'Low Stock';
          case 'out-of-stock':
            return item.stockStatus === 'Out of Stock';
          default:
            return true;
        }
      });
      console.log('After status filter:', filtered.length, 'items');
    }

    // Apply sorting
    console.log('Applying sorting...');
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (this.sortBy) {
        case 'name':
          comparison = a.product.name.localeCompare(b.product.name);
          break;
        case 'stock':
          comparison = a.currentStock - b.currentStock;
          break;
        case 'value':
          comparison = a.stockValue - b.stockValue;
          break;
        case 'lastUpdated':
          comparison = a.lastUpdated.getTime() - b.lastUpdated.getTime();
          break;
      }
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredItems = filtered;
    console.log('Final filtered items:', this.filteredItems.length);
    this.calculatePagination();
  }

  private calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    if (this.currentPage < 1) this.currentPage = 1;
  }

  get paginatedItems(): InventoryItem[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredItems.slice(startIndex, endIndex);
  }

  onSearchChange(): void {
    console.log('Search input changed to:', this.searchQuery);
    this.currentPage = 1;
    this.searchSubject$.next(this.searchQuery);
  }

  onFilterChange(): void {
    console.log('Filter changed to:', this.filterStatus);
    this.currentPage = 1;
    this.loadInventoryDataWithFilters();
  }

  onSortChange(): void {
    console.log('Sort changed to:', this.sortBy, this.sortOrder);
    this.loadInventoryDataWithFilters();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  toggleItemSelection(itemId: string): void {
    const index = this.selectedItems.indexOf(itemId);
    if (index > -1) {
      this.selectedItems.splice(index, 1);
    } else {
      this.selectedItems.push(itemId);
    }
  }

  selectAll(): void {
    this.selectedItems = this.paginatedItems.map(item => item.product.id);
  }

  deselectAll(): void {
    this.selectedItems = [];
  }

  updateStock(item: InventoryItem, newStock: number): void {
    if (newStock < 0) return;

    this.isLoading = true;
    this.spinnerService.show();

    const updatedProduct = {
      ...item.product,
      stockQuantity: newStock
    };

    this.productService.updateProduct(item.product.id, { stockQuantity: newStock })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Update local data
          item.currentStock = newStock;
          item.stockValue = newStock * (item.product.price || 0);
          item.lastUpdated = new Date();
          
          // Update stock status
          if (newStock === 0) {
            item.stockStatus = 'Out of Stock';
          } else if (newStock <= item.lowStockThreshold) {
            item.stockStatus = 'Low Stock';
          } else {
            item.stockStatus = 'In Stock';
          }

          this.calculateStats();
          this.applyFilters();
          this.isLoading = false;
          this.spinnerService.hide();
          
          // Add success feedback
          console.log('Stock updated successfully');
        },
        error: (error) => {
          console.error('Error updating stock:', error);
          this.isLoading = false;
          this.spinnerService.hide();
          console.error('Failed to update stock');
        }
      });
  }

  getStockStatusClass(status: string): string {
    switch (status) {
      case 'In Stock':
        return 'badge bg-success';
      case 'Low Stock':
        return 'badge bg-warning';
      case 'Out of Stock':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  exportInventoryReport(): void {
    // Implementation for exporting inventory report
    console.log('Exporting inventory report...');
  }

  generateReorderList(): InventoryItem[] {
    return this.inventoryItems.filter(item => 
      item.currentStock <= item.reorderPoint
    );
  }

  editProduct(productId: string): void {
    this.router.navigate(['/edit-product', productId]);
  }

  updateStockFromInput(item: InventoryItem, event: any): void {
    const newStock = parseInt(event.target.value);
    if (isNaN(newStock) || newStock < 0) {
      // Reset to current value if invalid input
      event.target.value = item.currentStock;
      return;
    }
    
    if (newStock !== item.currentStock) {
      this.updateStock(item, newStock);
    }
  }


}
