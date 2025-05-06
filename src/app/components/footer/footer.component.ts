import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { ProductService } from 'src/app/service/product.service';
import { Cart } from 'src/app/model/system.model';
import { Subscription } from 'rxjs';
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
      private productService: ProductService
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
    this.spinnerService.show();
    let cart: Cart | null = this.productService.getCurrentCartValue();
    if(cart != null) {
      this.productService.saveOrder(cart).subscribe(
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
