import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// import { CasesOverviewComponent } from './cases-overview/cases-overview.component';
import { ProgressPageComponent } from './progress-page/progress-page.component';

const routes: Routes = [

  // {
  //   path: '', component: CasesOverviewComponent, pathMatch: 'full'
  // },
   {
    path: '', component: ProgressPageComponent, pathMatch: 'full'
  },
  {
    path: 'dashboards',
    loadChildren: () => import('../core-dash/core-dash.module').then(m => m.CoreDashModule)
  },
  
  {
    path: '**', redirectTo: ''
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CasesRoutingModule { }
