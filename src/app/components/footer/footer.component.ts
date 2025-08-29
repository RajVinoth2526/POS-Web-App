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
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit, OnDestroy {
  isSalesScreen: boolean = false;
  cart!: Cart;
  disablePrintButton: boolean = true;
  private subscriptions: Subscription[] = [];

  constructor(private router: Router,
      private tosterService: ToastrService,
      private spinnerService: NgxSpinnerService,
      private productService: ProductService,
      private orderService: OrderService,
      private systemService: SystemService

  ) {
   }

   ngOnInit(): void {
    // Check initially and on every navigation
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const currentUrl = this.router.url;
        this.isSalesScreen = currentUrl.includes('sales-order-process');
      });

      this.productService.cart$.subscribe((data: Cart | null) => {
        if(data != null) this.disablePrintButton = true
        this.disablePrintButton = false;
      });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onPrint() {
    let oderId: number;
    this.spinnerService.show();
    let cart: Cart | null = this.productService.getCurrentCartValue();


    if(this.systemService.getOrderIdValue()?.value != null) {
      oderId = parseInt(this.systemService.getOrderIdValue()?.value || '0');
      if(oderId > 0) {
        oderId += 1;
        let orderIdObject = this.systemService.getOrderIdValue();
        if(orderIdObject != null) {
          if(cart)
            cart.orderId = oderId.toString();
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
    if(cart != null) {
      this.orderService.saveOrder(cart).subscribe(
        (response) => {
          this.tosterService.success('order saved added successfully!', 'Success');
          this.spinnerService.hide();
        },
        (error) => {
          this.tosterService.error('Failed to add product.', 'Error');
        }
      );
    }
    
  }


}
