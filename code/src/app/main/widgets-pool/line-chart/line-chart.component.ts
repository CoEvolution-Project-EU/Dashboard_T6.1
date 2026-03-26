import { Component, Input, OnInit, ViewChild, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { DataSyncService } from '../../data-sync.service';
import { Subscription } from 'rxjs';
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
  ApexYAxis,
  //ApexDataLabels,
  //ApexTitleSubtitle,
  ApexStroke,
  ApexGrid,
  ApexTooltip,
  //ApexLegend,
  //ApexAnnotations
} from "ng-apexcharts";
import { LinechartService } from './linechart.service';
//import { MatSnackBar } from '@angular/material/snack-bar';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  //dataLabels: ApexDataLabels;
  grid: ApexGrid;
  stroke: ApexStroke;
  //title: ApexTitleSubtitle;
  tooltip: ApexTooltip;
  //legend: ApexLegend;
  colors: string[];
  //annotations: ApexAnnotations;
};

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [
    CommonModule,
    NgApexchartsModule,
    MatLabel
  ],
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss']
})
export class LineChartComponent implements OnInit {
  @Input() config;
  @Input() heightResized: any;
  @Input() syncFlag: boolean;
  @Output() loading = new EventEmitter<any>();

  @ViewChild("chart", { static: false }) chart: ChartComponent;

  public chartOptions: Partial<ChartOptions>;

  //subs flag
  periodSubscription: Subscription;

  minDate;
  maxDate;
  interval;

  constructor(
    private dataSync: DataSyncService,
    private linechartServ: LinechartService,
    //private _snackBar: MatSnackBar

  ) {
  }

  ngOnInit(): void { }

  async ngOnChanges(changes: SimpleChanges) {
    //console.log(changes);

    if (changes.config && this.config) {
      this.loading.emit('start')

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

        //console.log(this.config.data.data);


        //create data for linechart
        let mainData = await this.linechartServ['createData_' + this.config.id](this.config.data.data)
        let datapoints = mainData.map(v => v.datapoints)

        //if linechart doesnt exist (first load of view/dash or wgt dragged into view from avail. widgets)
        //set the chartOptions and subscribe to periodSubscription if zoomSync is enabled.
        if (!this.chartOptions) {

          this.interval = this.config.data.data[0].aggregations.lineChart.interval
          this.minDate = this.config.start;
          this.maxDate = this.config.end;

          let timestamps = mainData.map(v => v.timestamp)

          this.chartOptions = {
            series: [
              {
                name: this.config['tooltipname'],
                data: datapoints
              }
            ],
            chart: {
              toolbar: {
                tools: {
                  pan: false
                }
              },
              id: this.config.id,
              //group: 'social',
              redrawOnWindowResize: true,
              redrawOnParentResize: true,
              height: 200,
              type: "line",
              zoom: {
                enabled: true,
                allowMouseWheelZoom: false
              },
              events: {
                zoomed: this.zoomAction.bind(this),
                beforeResetZoom: function (chartContext, opts) {
                  return {
                    xaxis: {
                      min: opts.globals.initialMinX,
                      max: opts.globals.initialMaxX
                    }
                  }
                }
              }
            },
            stroke: {
              curve: "straight",
              width: 1.5
            },
            grid: {
              borderColor: 'transparent',
              row: {
                colors: ["#F6F6F6", "#EBEBEB"],
                opacity: 0.5
              }
            },
            yaxis: {
              labels: {
                minWidth: 40,
                formatter: (val) => {

                  return val.toFixed(2) + this.config['yaxislabel'];
                },
              },
            },
            xaxis: {
              categories: timestamps,
              type: 'datetime',
              labels: {
                datetimeUTC: false,
                format: this.config['xaxisformat']
              },
              tooltip: {
                enabled: false
              }
            },
            tooltip: {
              x: {
                show: true,
                format: this.config['tooltipdateformat']
              },
            },
            colors: [this.config['color']],
            //annotations: {}
          };

          if (this.config.zoomSync && (!this.periodSubscription || this.periodSubscription.closed)) {

            this.periodSubscription = this.dataSync.currentPeriod.subscribe((incomingZoom) => {
              //console.log(incomingZoom , 'in Line')

              setTimeout(() => {

                if ((this.chart && incomingZoom.length == 3) && (this.minDate !== incomingZoom[0] || this.maxDate !== incomingZoom[1])) {
                  //console.log('mpike line zoom');

                  this.minDate = incomingZoom[0]
                  this.maxDate = incomingZoom[1]

                  this.chart.zoomX(incomingZoom[0], incomingZoom[1])
                }


              }, 200)


            })
          }

        } else {

          //if chart exists & new data request from back-end, update the data & time series of charts
          if (this.config.data.action == 'new') {
            //console.log('new');
            this.interval = this.config.data.data[0].aggregations.lineChart.interval
            this.minDate = this.config.start;
            this.maxDate = this.config.end;

            let timestamps = mainData.map(v => v.timestamp)

            this.chart.updateOptions({
              series: [
                {
                  name: this.config['tooltipname'],
                  data: datapoints
                }
              ],
              xaxis: {
                categories: timestamps,
                type: 'datetime',
                labels: {
                  datetimeUTC: false,
                  format: this.config['xaxisformat']
                },
                tooltip: {
                  enabled: false
                }

              }
            });

          } else {
            //if new data from local filters, update only the data -> not time series.
            this.chart.updateOptions({
              series: [
                {
                  name: this.config['tooltipname'],
                  data: datapoints
                }
              ]
            });


          }

        }


        setTimeout(() => {
          this.loading.emit('done')
        }, 600);


      }, (error) => {
        if (error !== 'first') console.log(error);
        //this.loading.emit('done')

      })

    }

    //resized event from dashboard. set a custom threshold per widget
    if (changes.heightResized && this.heightResized >= 0) {


      if (changes.heightResized.currentValue > 300) {

        this.chartOptions.chart.height = this.heightResized - 110;

        this.chart.updateOptions({
          chart: {
            height: this.heightResized - 110
          }
        })


      } else {

        this.chartOptions.chart.height = 200;

        this.chart.updateOptions({
          chart: {
            height: 200
          }
        })

      }

    }

  }

  zoomAction(chart, axis) {

    //console.log(axis);

    if (axis.xaxis.min && axis.xaxis.max) {

      let roundedMin = Math.round(axis.xaxis.min)
      let roundedMax = Math.round(axis.xaxis.max)

      if (this.minDate !== roundedMin || this.maxDate !== roundedMax) {
        //console.log('stelnei to line');

        this.minDate = roundedMin
        this.maxDate = roundedMax
        if (this.syncFlag) {
          this.dataSync.changePeriod([roundedMin, roundedMax, 'line'])
        }
      }

    }

  }



  ngOnDestroy() {

    if (this.periodSubscription) this.periodSubscription.unsubscribe();
  }
}







