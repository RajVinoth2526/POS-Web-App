import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CartItem } from 'src/app/model/system.model';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-add-product-popup',
  templateUrl: './add-product-popup.component.html',
  styleUrls: ['./add-product-popup.component.css']
})
export class AddProductPopupComponent implements OnInit {

  @Input() product: any;
  quantity: number = 1;
  cartItem: CartItem = {} as CartItem;
  size: string = '';
  currency: string = '';
  constructor(
     private _mdr: MatDialogRef<any>,
     @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if(this.data.product.isPartialAllowed) {
      this.cartItem.size = this.data.product.unitValue.toString();
    }
    this.cartItem.total = this.data.product.price;
   }

  ngOnInit(): void {
    this.currency = environment.currency;
  }

  onSizeChange(newSize: string): void {
    this.cartItem.size = newSize;
    this.cartItem.total = (this.data.product.price/this.data.product.unitValue) * parseFloat(newSize);
  }

  get totalPrice(): number {
    if(this.data.product.isPartialAllowed) {
     return  this.cartItem.total;
    } else {
      return this.data.product?.price * this.quantity;
    }
  }

  increase() {
    this.quantity++;
  }

  decrease() {
    if (this.quantity > 1) this.quantity--;
  }

  addProduct() {
    this.cartItem.product = this.data.product;
    this.cartItem.name = this.data.product.name;
    this.cartItem.price = this.data.product.price;
    this.cartItem.tax = this.data.product.taxRate ? (this.data.product.taxRate/100)*this.data.product.price : 0;
    this.cartItem.quantity = this.quantity;
    this.cartItem.total = this.totalPrice;
    this.cartItem.size = this.cartItem.size ? this.cartItem.size : '0';
    this._mdr.close(this.cartItem);
  }

  cancel() {
    console.log('Cancel clicked');
    this._mdr.close();
  }

  
  validateQuantity() {
    if (this.quantity < 1 || !this.quantity) {
      this.quantity = 1;
    }
  }

  onPriceChange(newPrice: number): void {
    this.cartItem.price = newPrice;
    this.cartItem.size = (newPrice/this.data.product.price).toFixed(2);
  }
  
}
