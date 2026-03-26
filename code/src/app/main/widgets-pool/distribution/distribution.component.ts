import { Component, Input, OnInit, ViewChild, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { DataSyncService } from '../../data-sync.service';
import { Subscription } from 'rxjs';
//import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

// Third-Party Modules
import { NgApexchartsModule } from 'ng-apexcharts';

// Angular Material Modules
import { MatLabel } from '@angular/material/form-field';

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexStroke
} from "ng-apexcharts";
import { DistributionService } from './distribution.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  colors: string[];
};

@Component({
  selector: 'app-distribution',
  standalone: true,
  imports: [
    CommonModule,
    NgApexchartsModule,
    MatLabel
  ],
  templateUrl: './distribution.component.html',
  styleUrls: ['./distribution.component.scss']
})
export class DistributionComponent implements OnInit {

  @Input() config;
  @Input() syncFlag: boolean;
  @Output() loading = new EventEmitter<any>();

  @ViewChild("brushChart", { static: false }) brushChart: ChartComponent;
  @ViewChild("ghostChart", { static: false }) ghostChart: ChartComponent;

  public chartOptions1: Partial<ChartOptions> = {
    chart: {
      id: 'ghostChart',
      type: "line"
    }
  };
  public brushChartOptions: Partial<ChartOptions>;

  //subs flag
  periodSubscription: Subscription;

  minDate;
  maxDate;
  brushMinDate;
  brushMaxDate;
  pendingRange: { min: number; max: number } | null = null;
  interval;

  timer;

  // Globally catch and suppress the specific ApexCharts "screenCTM" error
  // so it never bubbles up and crashes the app.
  swallowError = (evt: ErrorEvent) => {
    // If the error message mentions 'screenCTM', stop it here
    if (evt.error?.message?.includes('screenCTM')) {
      evt.stopImmediatePropagation(); // prevent further listeners
      evt.preventDefault(); // cancel the default browser error
    }
  };

  constructor(
    private dataSync: DataSyncService,
    private distributionServ: DistributionService
  ) { }

  ngOnInit(): void {}

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.config && this.config) {

      const promise = new Promise<void>((resolve, reject) => {
        // Handle different config IDs and check for data accordingly
        // First check if the config is first change and the data is empty
        if (changes.config.firstChange && this.config.data && this.config.data.data.length == 0) {
          reject('first');
        // If the config is first change and the data is not empty, resolve the promise 
        // (this happens if we manually set the data from the component's ts)
        } else if (changes.config.firstChange && this.config.data && this.config.data.data.length > 0) {
          resolve();
        // If the config is not first change and the data is not empty, resolve the promise
        } else if (this.config.data && this.config.data.data.length > 0) {
          resolve();
        // If the config is not first change and the data is empty, reject the promise
        } else {
          reject('no-data');
        }
      })

      promise.then(async () => {

        let mainData = await this.distributionServ['createData_' + this.config.id](this.config.data.data[0], this.config.start, this.config.end);

        if (!this.brushChartOptions) {
          this.interval = this.config.data.data[0].aggregations.distribution.interval
          this.minDate = this.config.start;
          this.maxDate = this.config.end;
          this.brushMinDate = this.config.start;
          this.brushMaxDate = this.config.end;

          this.brushChartOptions = {
            series: [{
              name: 'distribution',
              data: mainData.data
            }
            ],
            chart: {
              id: this.config.id,
              redrawOnWindowResize: true,
              redrawOnParentResize: true,
              height: 150,
              type: "area",
              events: {
                selection: this.onSelection.bind(this)
              },
              zoom: {
                enabled: false
              },
              brush: {
                enabled: true,
                target: 'ghostChart',
              },
              selection: {
                fill: {
                  color: this.config.brushColor,
                  opacity: 0.2
                },
                stroke: {
                  width: 1
                },
                enabled: true,
                xaxis: {
                  min: this.brushMinDate,
                  max: this.brushMaxDate,
                }
              }
            },
            stroke: {
              curve: "stepline",
              width: 1
            },
            xaxis: {
              categories: mainData.timestamps,
              type: 'datetime',
              labels: {
                datetimeUTC: false,
                format: this.config['xaxisformat']
              },
              tooltip: {
                enabled: false
              },
            },
            colors: [this.config.fillColor]
          };

          if (!this.periodSubscription || this.periodSubscription.closed) {

            this.periodSubscription = this.dataSync.currentPeriod.subscribe((incomingZoom) => {
              setTimeout(() => {

                if ((this.brushChart && incomingZoom.length == 3) && (this.brushMinDate !== incomingZoom[0] || this.brushMaxDate !== incomingZoom[1])) {
                  if (incomingZoom[0] < this.minDate) this.brushMinDate = this.minDate;
                  else this.brushMinDate = incomingZoom[0]

                  if (incomingZoom[1] > this.maxDate) this.brushMaxDate = this.maxDate;
                  else this.brushMaxDate = incomingZoom[1]

                  this.brushChart.updateOptions({
                    chart: {
                      selection: {
                        xaxis: {
                          min: this.brushMinDate,
                          max: this.brushMaxDate
                        }
                      }
                    }

                  })
                }


              }, 200)

            })
          }

        } else {

          if (this.config.data.action == 'new') {
            this.interval = this.config.data.data[0].aggregations.distribution.interval
            this.minDate = this.config.start;
            this.maxDate = this.config.end;
            this.brushMinDate = this.config.start;
            this.brushMaxDate = this.config.end;

            let options = {
              series: [{
                name: 'distribution',
                data: mainData.data
              }],
              xaxis: {
                categories: mainData.timestamps,
                type: 'datetime',
                labels: {
                  datetimeUTC: false,
                  format: this.config['xaxisformat']
                },
                tooltip: {
                  enabled: false
                }
              },
              chart: {
                selection: {
                  xaxis: {
                    min: this.brushMinDate,
                    max: this.brushMaxDate
                  }
                }
              }
            }

            this.brushChart.updateOptions(options);

          } else {

            let options = {
              series: [{
                name: 'distribution',
                data: mainData.data
              }]
            }
            this.brushChart.updateOptions(options);
          }
        }

        setTimeout(() => {
          this.loading.emit('done')
        }, 600);
      }, (error) => {
        if (error !== 'first') console.log(error);
      })
    }
  }

  // Fired whenever the user drags or scrolls the brush selection.
  // We record the new min/max immediately into `pendingRange`,
  // but do not apply it to the chart until mouseup.
  onSelection(_chart, evt: any) {
    const { min, max } = evt.xaxis || {};
    // Ignore invalid or zero-width selections
    if (min == null || max == null || min === max) {
      this.pendingRange = null;
      return;
    }
    // Round to integer timestamps
    const rMin = Math.round(min), rMax = Math.round(max);
    // If nothing actually changed, reset and bail
    if (rMin === this.brushMinDate && rMax === this.brushMaxDate) {
      this.pendingRange = null;
      return;
    }
    // Save the new window for application on mouseup
    this.pendingRange = { min: rMin, max: rMax };
  }

  onGlobalMouseUp = () => {
    // Run after any onSelection above (setTimeout 0 ms)
    setTimeout(() => {
      if (!this.pendingRange) return;  // nothing to do
  
      const { min, max } = this.pendingRange;
  
      // Update the brush window on the chart WITHOUT animations
      try {
        this.brushChart.updateOptions({ 
          chart: { 
            selection: { 
              xaxis: { 
                min, max 
              } 
            } 
          } 
        });
      } catch (e) {
        // If ApexCharts still throws internally, just warn and move on
        console.log('Brush update suppressed:', e);
      }
  
      // Commit the new window into our state
      this.brushMinDate = min;
      this.brushMaxDate = max;
  
      // Broadcast to other widgets if sync is on
      if (this.syncFlag) {
        this.dataSync.changePeriod([min, max, 'distribution']);
      }
  
      // Clear pending for the next drag/resize
      this.pendingRange = null;
    }, 0);
  };
  
  ngAfterViewInit() {
    // Listen for the global mouseup so we only apply filtering on release
    window.addEventListener('mouseup', this.onGlobalMouseUp);
  }
  
  ngOnDestroy() {
    // Clean up our event listener and any subscriptions
    window.removeEventListener('mouseup', this.onGlobalMouseUp);
    if (this.periodSubscription) {
      this.periodSubscription.unsubscribe();
    }
  }
}
