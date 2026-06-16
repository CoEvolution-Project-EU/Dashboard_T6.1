import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
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
    private spinner: NgxSpinnerService,
    public dialog: MatDialog,
    private nodejsService: NodejsDataService

  ) {

    this.spinner.show('assets');
    this.token = this.nodejsService.getToken();
    this.keycloak_id = this.nodejsService.getKeycloakId();
    this.spinner.hide('assets');


  }


  ngOnInit(): void { }

  isSidebarOpen = true;

  menu = [
    { name: 'Register a Model', icon: 'app_registration', route: ['/register_model'] },
    { name: 'Model Registry', icon: 'list', route: ['/model-registry'] },
    { name: 'Model Assessment', icon: 'shield', route: ['/model-assessment'] },
    { name: 'Risk Assessment', icon: 'warning', route: ['/risk-assessment'] },
    { name: 'Upload Reports', icon: 'upload', route: ['/upload-reports'] },
    { name: 'See Reports', icon: 'bar_chart', route: ['/see-reports'] }
  ]; 

    toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }


}
