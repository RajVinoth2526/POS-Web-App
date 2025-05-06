import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgxSpinner } from 'ngx-spinner/lib/ngx-spinner.enum';
import { ApiResponse } from 'src/app/model/system.model';
import { ProductService } from 'src/app/service/product.service';
import { Product } from 'src/app/model/system.model';
@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  @Output() add = new EventEmitter<any>();
  @Input() isViewStyleTable: boolean = false;
  @Input() isFromProductViews: boolean = false;

  constructor(private productService: ProductService,
    private spinnerService: NgxSpinnerService,
    private router: Router
  ) {
    this.getProducts();
  }
  ngOnInit(): void {

  }
  ngOnDestroy(): void {

  }

  getProducts() {
    this.spinnerService.show();  // Make sure you're showing the spinner before the request.
    
    this.productService.getAllProducts()
      .subscribe((response: any) => {
        const typedResponse = response as ApiResponse<Product[]>;
        this.spinnerService.hide();
        this.products = typedResponse.data;
      }, (error: any) => {
        this.spinnerService.hide();
      });
  }
  
  
  
  searchQuery: string = '';
  filteredProducts: any[] = [];

  // products: Product[] = [
  //   {
  //     name: 'Ice cream',
  //     price: 29.99,
  //     image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhoGiQM749deGW7TWVSgNhlogoKhOhn6RvA1AuI_shsMowIdeDve1WMgphYZjzcmUkIj8&usqp=CAU'
  //   },
  //   {
  //     name: 'Ice cream2',
  //     price: 27.99,
  //     image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhoGiQM749deGW7TWVSgNhlogoKhOhn6RvA1AuI_shsMowIdeDve1WMgphYZjzcmUkIj8&usqp=CAU'
  //   }
  //   ,
  //   {
  //     name: 'Ice cream3',
  //     price: 27.99,
  //     image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhoGiQM749deGW7TWVSgNhlogoKhOhn6RvA1AuI_shsMowIdeDve1WMgphYZjzcmUkIj8&usqp=CAU'
  //   },
  //   {
  //     name: 'Milk shake',
  //     price: 49.99,
  //     image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSc3e1FDbW6GxsQNgMUaBOhuSY0XPoq43VAmg&s'
  //   },
  //   {
  //     name: 'Vanilla milk shake',
  //     price: 89.99,
  //     image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7H-LQUOQa_UkpLxlCQyuwixXdBz9sWUSF4w&s'
  //   },
  //   {
  //     name: 'Ice cream',
  //     price: 29.99,
  //     image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhoGiQM749deGW7TWVSgNhlogoKhOhn6RvA1AuI_shsMowIdeDve1WMgphYZjzcmUkIj8&usqp=CAU'
  //   },
  //   {
  //     name: 'Milk shake',
  //     price: 49.99,
  //     image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSc3e1FDbW6GxsQNgMUaBOhuSY0XPoq43VAmg&s'
  //   },
  //   // {
  //   //   name: 'Chocolate milk shake',
  //   //   price: 19.99,
  //   //   image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ40a3S_b3kPxbUdrJ8-yRltvxDqppk-C45tA&s'
  //   // },
  //   {
  //     name: 'Vanilla milk shake345',
  //     price: 89.99,
  //     image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7H-LQUOQa_UkpLxlCQyuwixXdBz9sWUSF4w&s'
  //   },
  //   {
  //     name: 'Ice cream3556 3eqrafd awrsdgz asfxzcg vaefdxcgzv aefdxgcv',
  //     price: 29.99,
  //     image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhoGiQM749deGW7TWVSgNhlogoKhOhn6RvA1AuI_shsMowIdeDve1WMgphYZjzcmUkIj8&usqp=CAU'
  //   },
  //   {
  //     name: 'Milk shake2w3ert',
  //     price: 49.99,
  //     image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSc3e1FDbW6GxsQNgMUaBOhuSY0XPoq43VAmg&s'
  //   }
  // ];


  addToCart(product: Product) {
    this.add.emit(product);
  }

  onSearch() {
    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      this.filteredProducts = this.products.filter(product =>
        product.name.toLowerCase().includes(query)
      );
    } else {
      this.filteredProducts = this.products;
    }
  }

  editProduct(productId: string) {
    this.router.navigate(['/edit-product', productId]);
  }

}
