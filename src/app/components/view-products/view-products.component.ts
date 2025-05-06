import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-view-products',
  templateUrl: './view-products.component.html',
  styleUrls: ['./view-products.component.css']
})
export class ViewProductsComponent implements OnInit {
  isViewStyleTable = true;
  isFromProductViews = true;
  constructor() { }

  ngOnInit(): void {
  }

}
