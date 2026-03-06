import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CasesRoutingModule } from './cases-routing.module';
import { CasesOverviewComponent } from './cases-overview/cases-overview.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ProgressPageComponent } from './progress-page/progress-page.component';
@NgModule({
  declarations: [
    CasesOverviewComponent,
    ProgressPageComponent
  ],
  imports: [
    CommonModule,
    CasesRoutingModule,
    SharedModule
  ]
})
export class CasesModule { }
