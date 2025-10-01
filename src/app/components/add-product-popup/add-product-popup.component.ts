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
  private isUpdating: boolean = false; // Prevent infinite loops during updates
  
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
    if (this.isUpdating) return;
    
    this.isUpdating = true;
    this.cartItem.size = newSize;
    
    // Calculate price based on weight/volume
    // Example: 1000g unit value, 1200 unit price
    // If customer enters 100g, price should be (1200/1000) * 100 = 120
    const sizeValue = parseFloat(newSize) || 0;
    const pricePerUnit = this.data.product.price / this.data.product.unitValue;
    this.cartItem.total = pricePerUnit * sizeValue;
    
    this.isUpdating = false;
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

  // Size/Weight/Volume controls
  increaseSize() {
    if (this.data.product.isPartialAllowed) {
      const currentSize = parseFloat(this.cartItem.size) || 0;
      const newSize = currentSize + 1;
      this.cartItem.size = newSize.toString();
      this.onSizeChange(this.cartItem.size);
    }
  }

  decreaseSize() {
    if (this.data.product.isPartialAllowed) {
      const currentSize = parseFloat(this.cartItem.size) || 0;
      if (currentSize > 0.01) {
        const newSize = Math.max(0.01, currentSize - 1);
        this.cartItem.size = newSize.toString();
        this.onSizeChange(this.cartItem.size);
      }
    }
  }

  // Price controls
  increasePrice() {
    if (this.data.product.isPartialAllowed) {
      const currentPrice = this.cartItem.total || 0;
      const newPrice = currentPrice + 1;
      this.cartItem.total = newPrice;
      this.onPriceChange(newPrice);
    }
  }

  decreasePrice() {
    if (this.data.product.isPartialAllowed) {
      const currentPrice = this.cartItem.total || 0;
      if (currentPrice > 0.01) {
        const newPrice = Math.max(0.01, currentPrice - 1);
        this.cartItem.total = newPrice;
        this.onPriceChange(newPrice);
      }
    }
  }

  addProduct() {
    this.cartItem.product = this.data.product;
    this.cartItem.productId = this.data.product.id; // Add product ID
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
    if (this.isUpdating) return;
    
    this.isUpdating = true;
    this.cartItem.total = newPrice;
    
    // Calculate weight/volume based on price
    // Example: 1000g unit value, 1200 unit price
    // If customer enters 120 price, weight should be 120 / (1200/1000) = 100g
    const pricePerUnit = this.data.product.price / this.data.product.unitValue;
    const calculatedSize = newPrice / pricePerUnit;
    this.cartItem.size = calculatedSize.toFixed(2);
    
    this.isUpdating = false;
  }

  // Get the appropriate label based on unit type
  getUnitLabel(): string {
    const unitType = this.data.product.unitType?.toLowerCase();
    if (unitType === 'weight') {
      return 'Weight';
    } else if (unitType === 'volume') {
      return 'Volume';
    } else {
      return 'Amount';
    }
  }

  // Get price per unit for display
  getPricePerUnit(): number {
    // Always return the base rate: unit price / unit value
    // Example: 1200 / 1000 = 1.2 per gram
    return this.data.product.price / this.data.product.unitValue;
  }
  
}
