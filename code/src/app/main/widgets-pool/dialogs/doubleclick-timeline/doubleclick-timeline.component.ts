import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material Modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatLabel } from '@angular/material/form-field';

@Component({
  selector: 'app-doubleclick-timeline',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatRadioModule,
    MatButtonModule,
    MatLabel
  ],
  templateUrl: './doubleclick-timeline.component.html',
  styleUrls: ['./doubleclick-timeline.component.scss']
})
export class DoubleclickTimelineComponent implements OnInit {
  annotation = 'low';
  //sendToOthers = false;
  message = '';
  what;
  clickedTime;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    public _dialogRef: MatDialogRef<DoubleclickTimelineComponent>

  ) {
    //console.log(data);
    this.what = data.what;
    this.clickedTime = new Date(data.time).getTime()

  }

  ngOnInit(): void {
  }


  proceed() {
    //console.log(/\r|\n/.exec(this.message));
    this._dialogRef.close([this.annotation, this.message])
  }



}
