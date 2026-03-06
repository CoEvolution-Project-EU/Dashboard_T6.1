import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreDashRoutingModule } from './core-dash-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';

import { WidgetsPoolModule } from '../widgets-pool/widgets-pool.module';

import { SharedModule } from 'src/app/shared/shared.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { InspectDialogComponent } from './inspect-dialog/inspect-dialog.component';


@NgModule({
  declarations: [
    DashboardComponent,
    InspectDialogComponent
  ],
  imports: [
    CommonModule,
    CoreDashRoutingModule,
    WidgetsPoolModule,
    SharedModule,
    DragDropModule,
    
  ]
})
export class CoreDashModule { }
