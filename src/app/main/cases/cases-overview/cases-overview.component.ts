import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { CasesOverviewService } from './cases-overview.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-cases-overview',
  templateUrl: './cases-overview.component.html',
  styleUrls: ['./cases-overview.component.scss']
})
export class CasesOverviewComponent implements OnInit {

  assets; //could be w/e
  recentSaved;

  constructor(
    private overviewService: CasesOverviewService,
    private spinner: NgxSpinnerService,
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,

  ) {

    this.spinner.show('assets');
    this.getAssetsDetails();


  }


  ngOnInit(): void { }


  async getAssetsDetails(): Promise<void> {

    //get the assets/cases or w/e (differates per project).
    this.assets = await this.overviewService.getAssets();

    // console.log(this.assets);

    if (this.assets == 'http-error') {
      this._snackBar.open('An error has occured while trying to retrieve cases. Please try again.', null, { duration: 3500, panelClass: 'errorClass' })
    }
    else {

      this.recentSaved = this.assets.flatMap(asset => asset.savedViews).filter(v => v);

      // console.log(this.recentSaved)
    }

    this.spinner.hide('assets');



  }



}
