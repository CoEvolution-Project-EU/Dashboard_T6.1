import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { CasesOverviewService } from './cases-overview.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NodejsDataService } from '../../nodejs-data.service';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Third-party modules
import { NgxSpinnerModule } from 'ngx-spinner';

// Angular Material modules
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';

// Custom standalone components (if already converted)
import { NavbarComponent } from '../../../shared/navbar/navbar.component';

@Component({
  selector: 'app-cases-overview',
  templateUrl: './cases-overview.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgxSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSidenavModule,
    MatTooltipModule,
    NavbarComponent
  ],
  styleUrls: ['./cases-overview.component.scss']
})
export class CasesOverviewComponent implements OnInit {

  assets; //could be w/e
  recentSaved;
  token;
  // **Keycloak
  keycloak_id;
  constructor(
    private overviewService: CasesOverviewService,
    private spinner: NgxSpinnerService,
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private nodejsService: NodejsDataService

  ) {

    this.spinner.show('assets');
    this.token = this.nodejsService.getToken();
    // **Keycloak
    this.keycloak_id = this.nodejsService.getKeycloakId();
    // #TOUCH
    this.getAssetsDetails(this.token, '/assets');

  }


  ngOnInit(): void { }


  async getAssetsDetails(token, path): Promise<void> {

    //get the assets/cases or w/e (differates per project).

    // #TOUCH
    this.assets = await this.overviewService.getAssets(token, path, { "start": 1693603731000, "end": new Date(Date.now()).getTime() });

    if (this.assets == 'http-error') {
      this._snackBar.open('An error has occured while trying to retrieve cases. Please try again.', null, { duration: 3500, panelClass: 'errorClass' })
    } else {
      // console.log(this.assets);

      this.recentSaved = this.assets.flatMap(asset => asset.savedViews).filter(v => v);
      // this.assets = this.authRightsServ.checkCasesRights(this.assets);
    }

    this.spinner.hide('assets');



  }



}
