import { Routes } from '@angular/router';
import { DashboardResolver } from './main/core-dash/dashboard/dashboard.resolver';
import { canActivateAuthRole } from './guard/auth.guard'; // Adjust if needed

export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'in-progress',
    pathMatch: 'full'
  },
 {
    path: 'in-progress',
    loadComponent: () => import('./main/cases/in-progress/in-progress.component').then(m => m.InProgressComponent),
    canActivate: [canActivateAuthRole],
    data: { role: 'in-progress' }

  },
  {
    path: 'cases-overview',
    loadComponent: () => import('./main/cases/cases-overview/cases-overview.component').then(m => m.CasesOverviewComponent),
    canActivate: [canActivateAuthRole],
    data: { role: 'cases-overview' }

  },
  {
    path: 'dashboard/:id/:preconfView',
    resolve: {
      data: DashboardResolver
    },
    loadComponent: () => import('./main/core-dash/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [canActivateAuthRole],
  },
  {
    path: '**',
    redirectTo: 'cases-overview',
    pathMatch: 'full'
  }


];