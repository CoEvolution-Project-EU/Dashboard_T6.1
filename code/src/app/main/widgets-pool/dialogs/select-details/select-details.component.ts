import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-select-details',
  templateUrl: './select-details.component.html',
  styleUrls: ['./select-details.component.scss']
})
export class SelectDetailsComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    public _dialogRef: MatDialogRef<SelectDetailsComponent>
  ) {
    //console.log(data);

   }

  ngOnInit(): void {
  }

}
