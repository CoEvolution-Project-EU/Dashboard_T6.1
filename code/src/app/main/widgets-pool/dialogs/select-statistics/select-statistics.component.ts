import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatLabel } from '@angular/material/form-field';
@Component({
  selector: 'app-select-statistics',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatLabel
  ],
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
