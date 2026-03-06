import { Component, Inject, OnInit } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-bottomsheet',
  templateUrl: './bottomsheet.component.html',
  styleUrls: ['./bottomsheet.component.scss']
})
export class BottomsheetComponent implements OnInit {
  datatype = false;
  constructor(private _bottomSheetRef: MatBottomSheetRef<BottomsheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any

  ) {
    if (data.includes('line-chart')) this.datatype = true
  }

  openLink(event: MouseEvent): void {
    this._bottomSheetRef.dismiss();
    event.preventDefault();
  }


  ngOnInit(): void {
  }

}
