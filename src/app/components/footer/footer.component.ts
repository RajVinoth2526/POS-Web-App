import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { ProductService } from 'src/app/service/product.service';
import { Cart, OrderId } from 'src/app/model/system.model';
import { Subscription } from 'rxjs';
import { OrderService } from 'src/app/service/order.service';
import { SystemService } from 'src/app/service/system.service';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { DraftsPopupComponent } from '../drafts-popup/drafts-popup.component';
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit, OnDestroy {
  isSalesScreen: boolean = false;
  cart!: Cart;
  disablePrintButton: boolean = true;
  isCartEmpty: boolean = true;
  private subscriptions: Subscription[] = [];

  // Make router available in template for debugging
  constructor(public router: Router,
      private tosterService: ToastrService,
      private spinnerService: NgxSpinnerService,
      private productService: ProductService,
      private orderService: OrderService,
      private systemService: SystemService,
      private dialog: MatDialog

  ) {
   }

   ngOnInit(): void {
    // Check initial route
    this.checkCurrentRoute();
    
    // Check on every navigation
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkCurrentRoute();
      });

      const cartSubscription = this.productService.cart$.subscribe((data: Cart | null) => {
        if(data != null) {
          this.cart = data;
        this.disablePrintButton = false;
          this.isCartEmpty = data.orderItems.length === 0;
        } else {
          this.disablePrintButton = true;
          this.isCartEmpty = true;
        }
      });
      this.subscriptions.push(cartSubscription);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Check current route and set isSalesScreen accordingly
  private checkCurrentRoute(): void {
    const currentUrl = this.router.url;
    this.isSalesScreen = currentUrl.includes('sales-order-process');
  }

  // Save as Draft
  onSaveAsDraft() {
    if (this.isCartEmpty) {
      this.tosterService.warning('Cart is empty. Add some products before saving as draft.');
      return;
    }

    const draftCart: Cart = {
      ...this.cart,
      isDraft: true,
      orderStatus: 'draft'
    };

    this.spinnerService.show();
    this.orderService.saveDraftOrder(draftCart).subscribe({
      next: (response) => {
        if (response.success) {
          this.tosterService.success('Order saved as draft successfully!', 'Success');
          // Clear the cart after successfully saving as draft
          this.productService.clearCart();
        } else {
          this.tosterService.error('Failed to save draft order: ' + response.message, 'Error');
        }
        this.spinnerService.hide();
      },
      error: (error) => {
        this.tosterService.error('Error saving draft order. Please try again.', 'Error');
        this.spinnerService.hide();
      }
    });
  }

  // Complete Order
  onCompleteOrder() {
    if (this.isCartEmpty) {
      this.tosterService.warning('Cart is empty. Add some products before completing order.');
      return;
    }

    let oderId: number;
    this.spinnerService.show();
    let cart: Cart | null = this.productService.getCurrentCartValue();

    // Check if this is a restored draft order (has existing ID)
    const isRestoredDraft = cart && cart.id && cart.isDraft === true;

    if(this.systemService.getOrderIdValue()?.value != null) {
      oderId = parseInt(this.systemService.getOrderIdValue()?.value || '0');
      if(oderId > 0) {
        oderId += 1;
        let orderIdObject = this.systemService.getOrderIdValue();
        if(orderIdObject != null) {
          if(cart) {
            // For restored draft orders, keep the existing orderId, don't generate new one
            if (!isRestoredDraft) {
            cart.orderId = oderId.toString();
            }
            cart.isDraft = false;
            cart.orderStatus = 'completed'; // ✅ Set status as completed
          }
          
          // Only update order ID counter for new orders, not restored drafts
          if (!isRestoredDraft) {
          orderIdObject.value = oderId.toString();
          this.orderService.updateOrderId(orderIdObject).subscribe((response => {
            if(response) {
              if(response.data)
                this.systemService.updateOrderIdValue(response.data);
            }
          }))
        }
      }
    }
    }
    
    if(cart != null) {
      // Ensure the order status is set to completed before sending
      cart.orderStatus = 'completed';
      cart.isDraft = false;
      
      this.orderService.saveOrder(cart).subscribe(
        (response) => {
          this.tosterService.success('Order completed successfully!', 'Success');
          this.spinnerService.hide();
          // Clear the cart after successful order saving
          this.productService.clearCart();
        },
        (error) => {
          this.tosterService.error('Failed to complete order.', 'Error');
          this.spinnerService.hide();
        }
      );
    }
  }


  // Clear Cart
  onClearCart() {
    if (this.isCartEmpty) {
      this.tosterService.info('Cart is already empty.');
      return;
    }

    const confirmClear = confirm('Are you sure you want to clear the cart?');
    if (confirmClear) {
      this.productService.clearCart();
      this.tosterService.success('Cart cleared successfully.', 'Success');
    }
  }

  // Print Order (existing method)
  onPrint() {
    this.onCompleteOrder(); // Keep existing functionality
  }

  // Print order receipt
  private printOrder(order: Cart) {
    if (!order) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printContent = this.generatePrintContent(order);
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  }

  // Generate print content for order receipt
  private generatePrintContent(order: Cart): string {
    const currentDate = new Date().toLocaleString();
    const currency = this.systemService.getCurrencyValue() || '';
    
    let content = `
      <html>
        <head>
          <title>Order Receipt</title>
          <style>
            body { font-family: var(--theme-font-family, Arial, sans-serif); margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .order-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; font-size: 1.2em; }
            .footer { text-align: center; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Order Receipt</h2>
            <p>Order ID: ${order.orderId || 'N/A'}</p>
            <p>Date: ${currentDate}</p>
          </div>
          
          <div class="order-info">
            <p><strong>Customer:</strong> ${order.customerName || 'Walk-in Customer'}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod || 'Cash'}</p>
            ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
    `;

    order.orderItems.forEach(item => {
      content += `
        <tr>
          <td>${item.product.name}</td>
          <td>${currency}${item.price.toFixed(2)}</td>
          <td>${item.quantity}</td>
          <td>${currency}${item.total.toFixed(2)}</td>
        </tr>
      `;
    });

    content += `
            </tbody>
          </table>
          
          <div class="total">
            <p>Subtotal: ${currency}${order.subtotal.toFixed(2)}</p>
            <p>Tax: ${currency}${order.taxAmount.toFixed(2)}</p>
            <p>Discount: ${currency}${order.discountAmount.toFixed(2)}</p>
            <p>Total: ${currency}${order.totalAmount.toFixed(2)}</p>
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
          </div>
        </body>
      </html>
    `;

    return content;
  }

  // Open drafts popup
  openDraftsPopup(): void {
    const dialogRef = this.dialog.open(DraftsPopupComponent, {
      width: '90vw',
      maxWidth: '1000px',
      height: '80vh',
      maxHeight: '800px',
      disableClose: false,
      autoFocus: false,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      // Popup closed
    });
  }

}
