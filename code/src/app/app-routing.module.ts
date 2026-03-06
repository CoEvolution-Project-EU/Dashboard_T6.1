import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guard/auth.guard';

const routes: Routes = [
  // {
  //   path: '', redirectTo: 'assets-overview/assets-list', pathMatch: 'full'
  // },
   {
    path: '', redirectTo: 'in-progress', pathMatch: 'full'
  },
  {
    path: 'in-progress',
    loadChildren: ()=> import('./main/cases/cases.module').then(m=>m.CasesModule),
    canActivate: [AuthGuard]
  },
  // {
  //   path: 'assets-overview/assets-list',
  //   loadChildren: () => import('./main/cases/cases.module').then(m => m.CasesModule)
  //   //,
  //  // canActivate: [AuthGuard]
  // },
  // {
  //   path: '**', redirectTo: 'assets-overview/assets-list'
  // }
 {
    path: '**', redirectTo: 'in-progress'
 }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
