import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { OrderService } from '../../service/order.service';
import { ProductService } from '../../service/product.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { Cart, Filter, ApiResponse } from '../../model/system.model';
import { Subscription } from 'rxjs';
import { ConfirmationComponent } from '../confirmation/confirmation.component';

@Component({
  selector: 'app-drafts-popup',
  templateUrl: './drafts-popup.component.html',
  styleUrls: ['./drafts-popup.component.css']
})
export class DraftsPopupComponent implements OnInit, OnDestroy {
  drafts: Cart[] = [];
  filteredDrafts: Cart[] = [];
  totalCount: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  isLoading: boolean = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    public dialogRef: MatDialogRef<DraftsPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private orderService: OrderService,
    private productService: ProductService,
    private spinnerService: NgxSpinnerService,
    private tosterService: ToastrService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadDrafts();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadDrafts(): void {
    this.isLoading = true;
    this.spinnerService.show();
    
    const filter: Filter = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      name: '',
      orderStatus: 'draft' // Lowercase as requested for API URL
    };

    // Add sorting parameter if the Filter interface supports it
    // This might need to be added to the Filter interface
    (filter as any).sortBy = 'createdAt';
    (filter as any).sortOrder = 'desc';

    const subscription = this.orderService.getAllOrders(filter).subscribe({
      next: (response: ApiResponse<Cart[]>) => {
        this.spinnerService.hide();
        this.isLoading = false;
        
        this.drafts = response.data ?? [];
        
        // Sort drafts by date in descending order (newest first)
        this.drafts.sort((a, b) => {
          // Try different date fields
          const dateA = new Date(a.createdAt || a.updatedAt || a.cartDate || 0);
          const dateB = new Date(b.createdAt || b.updatedAt || b.cartDate || 0);
          
          return dateB.getTime() - dateA.getTime(); // Descending order
        });
        
        this.filteredDrafts = this.drafts;
        this.totalCount = response.totalCount ?? 0;
        this.totalPages = Math.ceil(this.totalCount / this.pageSize);
      },
      error: (error) => {
        this.spinnerService.hide();
        this.isLoading = false;
        console.error('Error loading drafts:', error);
        this.tosterService.error('Failed to load draft orders', 'Error');
      }
    });

    this.subscriptions.push(subscription);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadDrafts();
  }

  restoreDraftToCart(draftOrder: Cart): void {
    if (!draftOrder.id) {
      this.tosterService.error('Invalid draft order', 'Error');
      return;
    }

    this.spinnerService.show();
    
    const subscription = this.orderService.restoreDraftToCart(draftOrder.id).subscribe({
      next: (response: ApiResponse<Cart>) => {
        this.spinnerService.hide();
        if (response.success && response.data) {
          // Update the product service cart with the restored draft
          this.productService.updateCart(response.data);
          
          // Close the popup
          this.dialogRef.close();
          
          // Navigate to sales order process page
          this.router.navigate(['/sales-order-process']);
          
          this.tosterService.success('Draft order restored to cart successfully!', 'Success');
        } else {
          this.tosterService.error('Failed to restore draft order: ' + response.message, 'Error');
        }
      },
      error: (error) => {
        this.spinnerService.hide();
        console.error('Error restoring draft order:', error);
        this.tosterService.error('Error restoring draft order. Please try again.', 'Error');
      }
    });

    this.subscriptions.push(subscription);
  }

  deleteDraft(draftOrder: Cart): void {
    const confirmDialogRef = this.dialog.open(ConfirmationComponent, {
      width: '500px',
      disableClose: true,
      data: {
        id: draftOrder.id,
        title: 'Delete Draft Order',
        message: `Are you sure you want to delete draft order #${draftOrder.orderId}? This action cannot be undone.`,
      },
    });

    confirmDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.spinnerService.show();
        
        const subscription = this.orderService.deleteOrder(draftOrder.id ?? '').subscribe({
          next: (response: any) => {
            this.spinnerService.hide();
            this.tosterService.success('Draft order deleted successfully!', 'Success');
            this.loadDrafts(); // Refresh the list
          },
          error: (error: any) => {
            this.spinnerService.hide();
            this.tosterService.error('Failed to delete draft order', 'Error');
          }
        });

        this.subscriptions.push(subscription);
      }
    });
  }

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

  getStatusText(order: Cart): string {
    if (order.isDraft === true) {
      return 'Draft';
    }
    
    const status = order.orderStatus;
    if (status) {
      return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
    
    return 'Pending';
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
