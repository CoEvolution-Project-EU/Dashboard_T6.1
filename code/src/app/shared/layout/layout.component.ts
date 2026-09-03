import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterModule, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs';

import { NavbarComponent } from '../navbar/navbar.component';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';

import { environment } from 'src/environments/environment';

// Spinner
import { NgxSpinnerModule } from 'ngx-spinner';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatTooltipModule,
    NgxSpinnerModule
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
  isSidebarOpen = true;
  pageTitle = 'Configuration Monitoring & Visualisations';

  menu: Array<{
    name: string;
    icon: string;
    route: string;
    title: string;
    disabled?: boolean;
    externalUrl?: string;
  }> = [
    {
      name: 'Home',
      icon: 'home',
      route: '/home',
      title: 'Home'
    },
    // {
    //   name: 'In Progress',
    //   icon: 'pending_actions',
    //   route: '/in-progress',
    //   title: 'In Progress'
    // },
    {
      name: 'Register a Model',
      icon: 'app_registration',
      route: '/register-model',
      title: 'Register Model'
    },
    {
      name: 'Upload Report',
      icon: 'upload_file',
      route: '/upload-report',
      title: 'Upload Report'
    },
    {
      name: 'Model Monitoring',
      icon: 'monitor_heart',
      route: '/model-monitoring',
      title: 'Model Monitoring'
    },
    {
      name: 'Tools',
      icon: 'build',
      route: '/tools',
      title: 'Tools'
    },
    {
      name: 'Defences',
      icon: 'shield',
      route: '/defences',
      title: 'Defences'
    },
    {
      name: 'Data Generators',
      icon: 'dataset',
      route: '/data-generators',
      title: 'Data Generators'
    },
    {
      name: 'Gadgets',
      icon: 'extension',
      route: '/gadgets',
      title: 'Gadgets'
    },
    {
      name: 'AIMBOM',
      icon: 'receipt_long',
      route: '/aimbom',
      title: 'AIMBOM'
    },
    {
      name: 'Trusted Models',
      icon: 'verified',
      route: '/trusted-models',
      title: 'Trusted Models'
    },
    {
      name: 'Trusted Data',
      icon: 'storage',
      route: '/data',
      title: 'Trusted Data'
    },
    {
      name: 'Data Upload',
      icon: 'drive_folder_upload',
      route: '/data-upload',
      title: 'Data Upload'
    },
    {
      name: 'Security Runtime',
      icon: 'security',
      route: '/security-runtime',
      title: 'Security Runtime',
      externalUrl: environment.srme
    }
  ];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updatePageTitle();
      });

    this.updatePageTitle(); 
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  private updatePageTitle(): void {
    let child = this.activatedRoute.firstChild;

    while (child?.firstChild) {
      child = child.firstChild;
    }

    this.pageTitle ='Configuration Monitoring & Visualisations'
    // this.pageTitle =
    //   child?.snapshot.data['title'] ||
    //   this.menu.find(item => this.router.url.startsWith(item.route))?.title ||
    //   'Configuration Monitoring & Visualisations';
  }
}