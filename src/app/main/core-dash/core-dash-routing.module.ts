import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardResolver } from './dashboard/dashboard.resolver';

const routes: Routes = [

  // {
  //   path: '', redirectTo: '/cases'
  // },
  {
    path: 'core-dash/:id/:preconfView', component: DashboardComponent, pathMatch: 'full',  resolve: {
      data: DashboardResolver
    }
  },
  // {
  //   path: 'events-analysis', component: GlobalAnalysisComponent, pathMatch: 'full'
  // },
  {
    path: '**', redirectTo: '/assets-overview/assets-list'
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CoreDashRoutingModule { }
