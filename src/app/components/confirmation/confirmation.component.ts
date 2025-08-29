import { Component, OnInit, Inject  } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProductService } from 'src/app/service/product.service';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.css']
})
export class ConfirmationComponent implements OnInit {

  constructor(
    private _mdr: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  
  ngOnInit(): void {
  }

  confirm() {
    console.log('Confirm clicked');
    this._mdr.close(true);
  }
  
  cancel() {
    console.log('Cancel clicked');
    this._mdr.close(false);
  }
  
  testClick() {
    console.log('Test click worked');
  }

}
