import { Component, OnInit, OnDestroy } from '@angular/core';
import { Cart, CartItem, Product } from 'src/app/model/system.model';
import { ProductService } from 'src/app/service/product.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { cloneDeep } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


@Component({
  selector: 'app-sales-order',
  templateUrl: './sales-order.component.html',
  styleUrls: ['./sales-order.component.css']
})
export class SalesOrderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(private productService: ProductService,
    private tosterService: ToastrService,
    private spinnerService: NgxSpinnerService
  ) { }

  cart: CartItem[] = [];
  

  ngOnInit(): void {
    // Subscribe to cart changes to clear local cart when service cart is cleared
    this.productService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => {
        if (cart === null) {
          // Cart was cleared, clear local cart as well
          this.cart = [];
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  addToCart(cart: CartItem) {
    let existingItem: CartItem | undefined = this.cart.find(item => 
      (item.productId || item.product.id) === (cart.productId || cart.product.id)
    );
    if (existingItem) {
      if(cart.product.isPartialAllowed) {
        existingItem.size = (parseFloat(existingItem.size ?? '0') + parseFloat(cart.size ?? '0')).toString();
        existingItem.total = (existingItem.total + cart.total);
      } else {
        existingItem.quantity += cart.quantity;
        existingItem.total = existingItem.quantity * cart.product.price;
      }    
    } else {
      //clonedProduct.image = '';
      let cartItem: CartItem = {
        product: cart.product,
        productId: cart.product.id, // Add product ID
        name: cart.product.name,
        price: cart.product.price,
        tax: cart.product.taxRate ? (cart.product.taxRate/100)*cart.product.price : 0,
        quantity: cart.quantity,
        total: cart.total,
        size: cart.size ?? '0',
      }
      this.cart.push(cartItem);
    }
    this.processOrder();
  }
  
  processOrder() {
    let cart : Cart = {
      orderItems: this.cart,
      subtotal: this.cart.reduce((sum, item) => sum + item.total, 0),
      totalAmount: this.cart.reduce((sum, item) => sum + item.total, 0) -  this.cart.reduce((sum, item) => sum + (item.tax? item.tax : 0), 0),
      taxAmount: this.cart.reduce((sum, item) => sum + (item.tax? item.tax : 0), 0),
      discountAmount: 0,
      paymentMethod: 'Cash',
      createdAt: new Date(),
      updatedAt: new Date(),
      cartDate:  new Date().toISOString().split('T')[0],
      notes: '',
      isTakeaway: false,
    }

    this.productService.updateCartValue(cart);

  }

  updateCartEvent(cartItems: CartItem[]) {
    this.cart = cartItems;
    this.processOrder();
  }

}
