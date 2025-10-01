import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Cart, CartItem, Product } from 'src/app/model/system.model';
import { ProductService } from 'src/app/service/product.service';
import { SystemService } from 'src/app/service/system.service';
import { OrderService } from 'src/app/service/order.service';


@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html'
})
export class CartComponent implements OnInit {
  currency: string = '';
  @Input() cart: CartItem[] = [];
  @Output() cartChange = new EventEmitter<any[]>();
  @Output() updateCart = new EventEmitter<CartItem[]>();
  @Output() saveAsDraft = new EventEmitter<void>();
  @Output() completeOrder = new EventEmitter<void>();
  @Output() printCart = new EventEmitter<void>();
  @Output() cancelOrder = new EventEmitter<void>();
  @Output() clearCart = new EventEmitter<void>();
  
  private subscriptions: Subscription[] = [];

  constructor(private systemService: SystemService,
    private productService: ProductService,
    private orderService: OrderService
  ) {


  }
  ngOnInit(): void {
    this.currency = this.systemService.getCurrencyValue() ?? '';

    const cartSubscription = this.productService.cart$.subscribe((data: Cart | null) => {
      if(data == null ) this.cart = [];
      else this.cart = data.orderItems;


    });
    this.subscriptions.push(cartSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Define the card object with some dummy data
  get total(): number {
    return this.cart.reduce((sum, item) => sum + item.total, 0);
  }

  removeItem(index: number) {
    this.cart.splice(index, 1);
    this.cartChange.emit(this.cart);
    this.updateCart.emit(this.cart);
  }

  checkout(item: any) {
    this.cart = [];
    this.cartChange.emit([]);
  }

  getTotalAmount(): number {
    return this.cart.reduce((sum, item) => sum + item.total, 0);
  }

  removeFromCart(index: number) {
    this.cart.splice(index, 1);
    this.updateCart.emit(this.cart);
  }

  increaseQuantity(index: number) {
    this.cart[index].quantity++;
    this.cart[index].total = this.cart[index].quantity * this.cart[index].price;
    this.updateCart.emit(this.cart);
  }

  decreaseQuantity(index: number) {
    if (this.cart[index].quantity > 1) {
      this.cart[index].quantity--;
      this.cart[index].total = this.cart[index].quantity * this.cart[index].price;
    } else {
      // Optional: if quantity becomes 0, you can remove the item
      this.removeFromCart(index);
    }
    this.updateCart.emit(this.cart);
  }


  /**
   * Print order receipt
   */
  printOrder(order: Cart) {
    if (!order) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printContent = this.generatePrintContent(order);
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  }

  /**
   * Generate print content for order receipt
   */
  private generatePrintContent(order: Cart): string {
    const currentDate = new Date().toLocaleString();
    
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
          <td>${item.name}</td>
          <td>${this.currency}${item.price.toFixed(2)}</td>
          <td>${item.quantity}</td>
          <td>${this.currency}${item.total.toFixed(2)}</td>
        </tr>
      `;
    });

    content += `
            </tbody>
          </table>
          
          <div class="total">
            <p>Subtotal: ${this.currency}${order.subtotal.toFixed(2)}</p>
            <p>Tax: ${this.currency}${order.taxAmount.toFixed(2)}</p>
            <p>Discount: ${this.currency}${order.discountAmount.toFixed(2)}</p>
            <p>Total: ${this.currency}${order.totalAmount.toFixed(2)}</p>
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
          </div>
        </body>
      </html>
    `;

    return content;
  }

}
