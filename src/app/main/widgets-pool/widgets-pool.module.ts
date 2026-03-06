import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TimelineComponent } from './timeline/timeline.component';
import { DetailsComponent } from './details/details.component';
import { LineChartComponent } from './line-chart/line-chart.component';
import { NetworkGraphComponent } from './network-graph/network-graph.component';
import { DistributionComponent } from './distribution/distribution.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { DoubleclickTimelineComponent } from './dialogs/doubleclick-timeline/doubleclick-timeline.component';
import { BottomsheetComponent } from './dialogs/bottomsheet/bottomsheet.component';

import { SharedModule } from 'src/app/shared/shared.module';

import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { NgApexchartsModule } from 'ng-apexcharts';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatSliderModule} from '@angular/material/slider';
import { SelectStatisticsComponent } from './dialogs/select-statistics/select-statistics.component';
import { SelectDetailsComponent } from './dialogs/select-details/select-details.component';

@NgModule({
  declarations: [
    TimelineComponent,
    DetailsComponent,
    LineChartComponent,
    NetworkGraphComponent,
    StatisticsComponent,
    DistributionComponent,
    DoubleclickTimelineComponent,
    BottomsheetComponent,
    SelectStatisticsComponent,
    SelectDetailsComponent

  ],
  imports: [
    CommonModule,
    SharedModule,
    NgApexchartsModule,
    NgxChartsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatBottomSheetModule,
    MatSliderModule
  ],
  exports: [
    TimelineComponent,
    DetailsComponent,
    LineChartComponent,
    NetworkGraphComponent,
    DistributionComponent,
    StatisticsComponent

    ]
})
export class WidgetsPoolModule { }
