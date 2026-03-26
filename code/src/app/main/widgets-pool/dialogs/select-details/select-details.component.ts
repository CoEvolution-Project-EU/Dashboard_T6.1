import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatLabel } from '@angular/material/form-field';
@Component({
  selector: 'app-select-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatLabel
  ],
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
