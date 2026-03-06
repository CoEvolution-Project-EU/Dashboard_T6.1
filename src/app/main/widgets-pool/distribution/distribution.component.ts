import { Component, Input, OnInit, ViewChild, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { DataSyncService } from '../../data-sync.service';
import { Subscription } from 'rxjs';
//import { MatSnackBar } from '@angular/material/snack-bar';

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  //ApexYAxis,
  //ApexDataLabels,
  //ApexTitleSubtitle,
  ApexStroke,
  //ApexGrid,
  //ApexTooltip,
  //ApexLegend,
  //ApexAnnotations,
  //ApexMarkers,
  //ApexFill,
  //ApexPlotOptions
} from "ng-apexcharts";
import { DistributionService } from './distribution.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  //yaxis: ApexYAxis;
  //dataLabels: ApexDataLabels;
  //grid: ApexGrid;
  stroke: ApexStroke;
  //title: ApexTitleSubtitle;
  //tooltip: ApexTooltip;
  //legend: ApexLegend;
  colors: string[];
  //annotations: ApexAnnotations;
  //markers: ApexMarkers;
  //fill:ApexFill;
  //plotOptions: ApexPlotOptions;

};

@Component({
  selector: 'app-distribution',
  templateUrl: './distribution.component.html',
  styleUrls: ['./distribution.component.scss']
})
export class DistributionComponent implements OnInit {

  @Input() config;
  @Input() syncFlag: boolean;
  @Output() loading = new EventEmitter<any>();

  @ViewChild("brushChart", { static: false }) brushChart: ChartComponent;

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
  interval;

  timer;

  constructor(
    private dataSync: DataSyncService,
    private distributionServ: DistributionService,
    //private _snackBar: MatSnackBar

  ) { }

  ngOnInit(): void {
  }

  async ngOnChanges(changes: SimpleChanges) {

    //console.log(changes);

    if (changes.config && this.config) {
      //this.loading.emit('start')

      const promise = new Promise<void>((resolve, reject) => {

        if (this.config.data.data.length > 0) {

          resolve()

        } else reject('no-data')

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
                brushScrolled: this.scrolled.bind(this)
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
            // plotOptions: {
            //   bar: {
            //       borderRadius: 2,
            //       columnWidth: '100%',
            //       barHeight: '100%'
            //   }
            // },
            stroke: {
              curve: "stepline",
              width: 1
            },
            // grid: {
            //   borderColor: 'transparent',
            //   row: {
            //     colors: ["#F6F6F6", "#EBEBEB"],
            //     opacity: 0.5
            //   }
            // },
            //yaxis: {
            // {
            //   seriesName:'Alerts',
            // },
            // {
            //   opposite:true,
            //   seriesName:'Netflows'
            // }
            //logarithmic: true,
            // labels: {
            //   minWidth: 40,
            //   formatter: (val) => {
            //     return val + this.config['yaxislabel'];
            //   }
            // }
            //},
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
            // tooltip: {
            //   x: {
            //     show: true,
            //     format: this.config['tooltipdateformat']
            //   },
            // },
            colors: [this.config.fillColor] //[this.barsColors.bind(this)],
            // annotations: {}
          };


          if (!this.periodSubscription || this.periodSubscription.closed) {

            this.periodSubscription = this.dataSync.currentPeriod.subscribe((incomingZoom) => {
              //console.log(incomingZoom , 'in distribution')

              setTimeout(() => {

                if ((this.brushChart && incomingZoom.length == 3) && (this.brushMinDate !== incomingZoom[0] || this.brushMaxDate !== incomingZoom[1])) {
                  //console.log('mpike distribution zoom')

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
        console.log(error);
        //this.loading.emit('done')

      })

    }

  }


  scrolled(a, xyaxis) {

    clearTimeout(this.timer)

    this.timer = setTimeout(() => {

      if (xyaxis.xaxis.min && xyaxis.xaxis.max) {

        this.brushChart.updateOptions({
          chart: {
            selection: {
              xaxis: {
                min: xyaxis.xaxis.min,
                max: xyaxis.xaxis.max
              }
            }
          }
        })

        let roundedMin = Math.round(xyaxis.xaxis.min)
        let roundedMax = Math.round(xyaxis.xaxis.max)

        if (this.brushMinDate !== roundedMin || this.brushMaxDate !== roundedMax) {

          //console.log('stelnei to distribution');

          this.brushMinDate = roundedMin;
          this.brushMaxDate = roundedMax;

          if (this.syncFlag) {
            this.dataSync.changePeriod([roundedMin, roundedMax, 'distribution'])
          }
        }

      }

    }, 100)

  }


  ngOnDestroy() {
    if (this.periodSubscription) this.periodSubscription.unsubscribe();
  }


}
