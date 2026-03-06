import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-doubleclick-timeline',
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
      this._dialogRef.close([this.annotation,this.message])
  }


 
}
