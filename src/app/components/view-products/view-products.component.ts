import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProductService } from '../../service/product.service';
import { SystemService } from '../../service/system.service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-view-products',
  templateUrl: './view-products.component.html',
  styleUrls: ['./view-products.component.css']
})
export class ViewProductsComponent implements OnInit, OnDestroy {
  isViewStyleTable = false;
  isFromProductViews = true;
  
  // New properties for modern UI
  searchQuery: string = '';
  selectedCategory: string = '';
  sortBy: string = 'name';
  
  // Stats properties
  totalCount: number = 0;
  availableProducts: number = 0;
  lowStockProducts: number = 0;
  averagePrice: number = 0;

  // Search functionality
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private systemService: SystemService
  ) { }

  ngOnInit(): void {
    // Initialize search functionality with debounce
    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Search is handled by the product-list component via input binding
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Toggle between grid and table view
  toggleView(isTable: boolean): void {
    this.isViewStyleTable = isTable;
  }

  // Handle search functionality
  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  // Clear search
  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch();
  }

  // Handle category filter
  onCategoryFilter(): void {
    // This will be handled by the product-list component
    // The selected category is passed via ngModel
  }

  // Handle sort change
  onSortChange(): void {
    // This will be handled by the product-list component
    // The sort option is passed via ngModel
  }

}
