import { Routes } from '@angular/router';
import { DashboardResolver } from './main/core-dash/dashboard/dashboard.resolver';
import { LayoutComponent } from './shared/layout/layout.component';
import { canActivateAuthRole } from './guard/auth.guard';

export const appRoutes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [canActivateAuthRole],
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        canActivate: [canActivateAuthRole],
        loadComponent: () =>
          import('./main/cases/home/home.component').then(m => m.HomeComponent),
        data: { role: 'home', title: 'Home' }
      },
      {
        path: 'in-progress',
        canActivate: [canActivateAuthRole],
        loadComponent: () =>
          import('./main/cases/in-progress/in-progress.component').then(m => m.InProgressComponent),
        data: { role: 'in-progress', title: 'In Progress' }
      },
      {
        path: 'cases-overview',
        canActivate: [canActivateAuthRole],
        loadComponent: () =>
          import('./main/cases/cases-overview/cases-overview.component').then(m => m.CasesOverviewComponent),
        data: { role: 'cases-overview', title: 'Cases Overview' }
      },
      {
        path: 'register-model',
        canActivate: [canActivateAuthRole],
        loadComponent: () =>
          import('./main/cases/register-model/register-model.component').then(m => m.RegisterModelComponent),
        data: { role: 'register-model', title: 'Register Model' }
      },
      {
        path: 'upload-report',
        canActivate: [canActivateAuthRole],
        loadComponent: () =>
          import('./main/cases/upload-report/upload-report.component').then(m => m.UploadReportComponent),
        data: { role: 'upload-report', title: 'Upload Report' }
      },
      {
        path: 'model-monitoring',
        canActivate: [canActivateAuthRole],
        loadComponent: () =>
          import('./main/cases/model-monitoring/model-monitoring.component').then(m => m.ModelMonitoringComponent),
        data: { role: 'model-monitoring', title: 'Model Monitoring' }
      },
      {
        path: 'trusted-models',
        canActivate: [canActivateAuthRole],
        loadComponent: () =>
          import('./main/cases/trusted-models/trusted-models.component').then(m => m.TrustedModelsComponent),
        data: { role: 'trusted-models', title: 'Trusted Models' }
      },
      {
        path: 'tools',
        canActivate: [canActivateAuthRole],
        loadComponent: () =>
          import('./main/cases/tools/tools.component').then(m => m.ToolsComponent),
        data: { role: 'tools', title: 'Tools' }
      },
      {
        path: 'defences',
        canActivate: [canActivateAuthRole],
        loadComponent: () =>
          import('./main/cases/defences/defences.component').then(m => m.DefencesComponent),
        data: { role: 'defences', title: 'Defences' }
      },
      {
        path: 'data-generators',
        canActivate: [canActivateAuthRole],
        loadComponent: () =>
          import('./main/cases/data-generators/data-generators.component').then(m => m.DataGeneratorsComponent),
        data: { role: 'data-generators', title: 'Data Generators' }
      },
      {
        path: 'gadgets',
        canActivate: [canActivateAuthRole],
        loadComponent: () =>
          import('./main/cases/gadgets/gadgets.component').then(m => m.GadgetsComponent),
        data: { role: 'gadgets', title: 'Gadgets' }
      },
      {
        path: 'data-upload',
        canActivate: [canActivateAuthRole],
        loadComponent: () =>
          import('./main/cases/data-upload/data-upload.component').then(m => m.DataUploadComponent),
        data: { role: 'data-upload', title: 'Data Upload' }
      },
      {
        path: 'data',
        canActivate: [canActivateAuthRole],
        loadComponent: () =>
          import('./main/cases/data/data.component').then(m => m.DataComponent),
        data: { role: 'data', title: 'Trusted Data' }
      },
      {
        path: 'aimbom',
        canActivate: [canActivateAuthRole],
        loadComponent: () =>
          import('./main/cases/aimbom/aimbom.component').then(m => m.AimbomComponent),
        data: { role: 'aimbom', title: 'AIMBOM' }
      },
      {
        path: 'security-runtime',
        canActivate: [canActivateAuthRole],
        loadComponent: () =>
          import('./main/cases/security-runtime/security-runtime.component').then(m => m.SecurityRuntimeComponent),
        data: { role: 'security-runtime', title: 'Security Runtime' }
      },
    ]
  },
  {
    path: 'dashboard/:id/:preconfView',
    resolve: {
      data: DashboardResolver
    },
    loadComponent: () =>
      import('./main/core-dash/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: '**',
    redirectTo: 'cases-overview',
    pathMatch: 'full'
  }
];