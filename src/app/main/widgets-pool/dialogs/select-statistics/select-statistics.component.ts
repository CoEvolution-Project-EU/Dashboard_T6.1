import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-select-statistics',
  templateUrl: './select-statistics.component.html',
  styleUrls: ['./select-statistics.component.scss']
})
export class SelectStatisticsComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    public _dialogRef: MatDialogRef<SelectStatisticsComponent>
  ) {
    //console.log(data);
    
   }

  ngOnInit(): void {
  }

}
