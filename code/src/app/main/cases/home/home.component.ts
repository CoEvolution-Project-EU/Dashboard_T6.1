import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  private router = inject(Router);

  readonly websiteUrl = 'https://coevolution-project.eu';

  readonly quickLinks = [
    {
      title: 'Register a Model',
      description: 'Submit a new model and its metadata to the CoEvolution Hub.',
      icon: 'app_registration',
      route: '/register-model'
    },
    {
      title: 'Model Monitoring',
      description: 'Browse registered models and inspect reports per version.',
      icon: 'monitor_heart',
      route: '/model-monitoring'
    },
    {
      title: 'Trusted Models',
      description: 'Manage trusted-model artefacts stored in the trusted-models bucket.',
      icon: 'verified',
      route: '/trusted-models'
    },
    {
      title: 'AIMBOM',
      description: 'Browse every generated AI-MBOM and download or preview it.',
      icon: 'receipt_long',
      route: '/aimbom'
    }
  ];

  go(route: string): void {
    this.router.navigate([route]);
  }
}
