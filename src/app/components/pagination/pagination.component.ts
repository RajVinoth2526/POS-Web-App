import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';


@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent implements OnInit {

  @Input() totalCount = 0;
  @Input() pageNumber = 1;
  @Input() pageSize = 10;

  @Output() pageChange = new EventEmitter<{ pageNumber: number, pageSize: number }>();

  pageSizes = [5, 10, 20, 50];

  ngOnInit(): void {

  }

  getEndItem(): number {
    return Math.min(this.pageNumber * this.pageSize, this.totalCount);
  }
  
  
  onPageSizeChange() {
    this.pageNumber = 1;
    this.pageChange.emit({ pageNumber: this.pageNumber, pageSize: this.pageSize });
  }

  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.pageChange.emit({ pageNumber: this.pageNumber, pageSize: this.pageSize });
    }
  }

  nextPage() {
    if (this.pageNumber * this.pageSize < this.totalCount) {
      this.pageNumber++;
      this.pageChange.emit({ pageNumber: this.pageNumber, pageSize: this.pageSize });
    }
  }

}
