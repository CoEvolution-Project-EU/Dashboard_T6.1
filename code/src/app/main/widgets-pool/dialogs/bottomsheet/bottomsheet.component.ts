import { Component, Inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { CommonModule } from '@angular/common';

// Angular Material Modules
import { MatLabel } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-bottomsheet',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatLabel],
  templateUrl: './bottomsheet.component.html',
  styleUrls: ['./bottomsheet.component.scss']
})
export class BottomsheetComponent {
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
}
