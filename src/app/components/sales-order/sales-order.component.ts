import { Component, OnInit } from '@angular/core';
import { Cart, CartItem, Product } from 'src/app/model/system.model';
import { ProductService } from 'src/app/service/product.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { cloneDeep } from 'lodash';


@Component({
  selector: 'app-sales-order',
  templateUrl: './sales-order.component.html',
  styleUrls: ['./sales-order.component.css']
})
export class SalesOrderComponent implements OnInit {

  constructor(private productService: ProductService,
    private tosterService: ToastrService,
    private spinnerService: NgxSpinnerService
  ) { }

  cart: CartItem[] = [];
  

  ngOnInit(): void {
  }
  
  addToCart(product: Product) {
    let existingItem: CartItem | undefined = this.cart.find(item => item.product.id === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
      existingItem.total = existingItem.quantity * product.price;
    } else {
      const clonedProduct = cloneDeep(product);
      //clonedProduct.image = '';
      let cartItem: CartItem = {
        product: clonedProduct,
        name: product.name,
        price: product.price,
        tax: product.taxRate ? (product.taxRate/100)*product.price : 0,
        quantity: 1,
        total: product.price
      }
      this.cart.push(cartItem);
    }
    this.processOrder();
  }
  
  processOrder() {
    let cart : Cart = {
      items: this.cart,
      subtotal: this.cart.reduce((sum, item) => sum + item.total, 0),
      totalAmount: this.cart.reduce((sum, item) => sum + item.total, 0) -  this.cart.reduce((sum, item) => sum + (item.tax? item.tax : 0), 0),
      taxAmount: this.cart.reduce((sum, item) => sum + (item.tax? item.tax : 0), 0),
      discountAmount: 0,
      paymentMethod: 'Cash',
      createdAt: new Date(),
      updatedAt: new Date(),
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
