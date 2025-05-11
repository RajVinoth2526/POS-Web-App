import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Cart, CartItem, Product } from 'src/app/model/system.model';
import { SystemService } from 'src/app/service/system.service';


@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html'
})
export class CartComponent implements OnInit {
  currency: string = '';
  @Input() cart: CartItem[] = [];
  @Output() cartChange = new EventEmitter<any[]>();
  @Output() updateCart = new EventEmitter<CartItem[]>();

  constructor(private systemService: SystemService) {


  }
  ngOnInit(): void {
    this.currency = this.systemService.getCurrencyValue() ?? '';
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



}
