import { Component, ElementRef, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { StatisticsService } from './statistics.service';
import { Sort } from '@angular/material/sort';
import { DataSyncService } from '../../data-sync.service';
import { MatDialog } from '@angular/material/dialog';
import { SelectStatisticsComponent } from '../dialogs/select-statistics/select-statistics.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material Modules
import { MatLabel } from '@angular/material/form-field';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatLabel,
    MatSortModule,
    MatIconModule
  ],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {

  @Input() config: any;
  @Input() heightResized: any;
  @Input() syncFlag: boolean;

  periodSubscription: Subscription;
  startTime;
  endTime;

  @Output() loading = new EventEmitter<any>();

  pieData = [];
  barData = [];
  barData2 = [];
  stackedData = [];

  pieParamIndx
  pieTitle = ""

  barParamIndx
  barTitle = ""

  barParamIndx2
  barTitle2 = ""

  stackedParamIndx
  stackedTitle = ""

  statsParams
  stringData;
  numericData;

  recordsCount = 0;

  sortedNumericData: any[];
  sortedStringData: any[];

  chartsHeight = 250;

  @ViewChild("statParams", { static: false }) statParams: ElementRef;

  constructor(
    private statServ: StatisticsService,
    private dataSync: DataSyncService,
    public dialog: MatDialog


  ) { }

  ngOnInit(): void {

  }

  async ngOnChanges(changes: SimpleChanges) {
    //console.log(changes);

    if (changes.config && this.config) {

      this.loading.emit('start')
      //reset data
      this.pieData = [];
      this.barData = [];
      this.barData2 = [];
      this.stackedData = [];

      this.stringData = [];
      this.numericData = [];
      this.recordsCount = 0;

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
        // console.log(this.config.data)
        //if chart indices are undefined -> first load of dash/view or wgt dragged into view from available
        if (!this.pieParamIndx || !this.barParamIndx || !this.barParamIndx2 || !this.stackedParamIndx) {

          //get start,end from dashboard/preconf (if the loaded datasets dont require dates, startTime,endTime wont be used. NO need to delete these lines)
          this.startTime = this.config.start;
          this.endTime = this.config.end;
          let activeParams;

          if (!this.config.data.data[0].hits) {

            activeParams = this.config.params.filter(v => v.dataType !== "raw");

          } else {

            activeParams = this.config.params.filter(v => v.dataType !== "buckets");

          }

          //check if there are parameters that will feed any of the charts
          this.pieParamIndx = activeParams.findIndex(p => p.chart == 'pie')
          this.barParamIndx = activeParams.findIndex(p => p.chart == 'bar')
          this.barParamIndx2 = activeParams.findIndex(p => p.chart == 'bar2')
          this.stackedParamIndx = activeParams.findIndex(p => p.chart == 'stacked')



          //if yes, set the titles.
          if (this.pieParamIndx > -1) {
            this.pieTitle = activeParams[this.pieParamIndx].name
          }

          if (this.barParamIndx > -1) {
            this.barTitle = activeParams[this.barParamIndx].name
          }
          if (this.barParamIndx2 > -1) {
            this.barTitle2 = activeParams[this.barParamIndx2].name
          }

          if (this.stackedParamIndx > -1) {
            this.stackedTitle = activeParams[this.stackedParamIndx].name
          }

          // //get the param values that will feed the stats from  config
          this.statsParams = activeParams.filter(v => v.stats)

          if (this.config.hasDates.zoomSync && (!this.periodSubscription || this.periodSubscription.closed)) {

            this.periodSubscription = this.dataSync.currentPeriod.subscribe((incomingZoom) => {
              // console.log(incomingZoom , 'in Statistic')

              setTimeout(async () => {

                if ((incomingZoom.length == 3) && (this.startTime !== incomingZoom[0] || this.endTime !== incomingZoom[1])) {

                  //console.log('mpike statistics zoom');
                  this.startTime = incomingZoom[0]
                  this.endTime = incomingZoom[1]


                  let finalData = await this.finalFilter()
                  this.createStats(finalData)

                }

              }, 200)

            })

          }

          // //every time, pass the final data through the finalFilter (even if no dates are required)
          // let finalData =  await this.finalFilter()
          // //create/update charts-statistics based on the final filtered data.
          // this.createStats(finalData)


        } else if (this.config.data.action == 'new') {

          this.startTime = this.config.start;
          this.endTime = this.config.end;
          let activeParams;


          if (!this.config.data.data[0].hits) {

            activeParams = this.config.params.filter(v => v.dataType !== "raw");

          } else {

            activeParams = this.config.params.filter(v => v.dataType !== "buckets");

          }

          //check if there are parameters that will feed any of the charts
          this.pieParamIndx = activeParams.findIndex(p => p.chart == 'pie')
          this.barParamIndx = activeParams.findIndex(p => p.chart == 'bar')
          this.barParamIndx2 = activeParams.findIndex(p => p.chart == 'bar2')
          this.stackedParamIndx = activeParams.findIndex(p => p.chart == 'stacked')


          //if yes, set the titles.
          if (this.pieParamIndx > -1) {
            this.pieTitle = activeParams[this.pieParamIndx].name
          }

          if (this.barParamIndx > -1) {
            this.barTitle = activeParams[this.barParamIndx].name
          }
          if (this.barParamIndx2 > -1) {
            this.barTitle2 = activeParams[this.barParamIndx2].name
          }

          if (this.stackedParamIndx > -1) {
            this.stackedTitle = activeParams[this.stackedParamIndx].name
          }

          this.statsParams = activeParams.filter(v => v.stats)

        }

        //if new date derived from filters -> no need to update any of the configuration/options

        //every time, pass the final data through the finalFilter (even if no dates are required)
        let finalData = await this.finalFilter()
        //create/update charts-statistics based on the final filtered data.
        this.createStats(finalData)




        setTimeout(() => {
          this.loading.emit('done')
        }, 800);


      }, (error) => {
        if (error !== 'first') console.log(error);
        //this.loading.emit('done')

      })
    }

    //user resided the widget
    if (changes.heightResized && this.heightResized >= 0) {
      //console.log(this.heightResized);

      //changing the charts height -> calculating the size taking into consideration the stats height + the labels/buttons of the wdgt
      //note that stats height has a range of height (min:100 - max:300)
      this.chartsHeight = this.heightResized - (150 + this.statParams.nativeElement.clientHeight)

    }

  }

  async finalFilter() {

    let finalData = [];

    if (!this.config.data.data[0].hits) {

      if (this.config.hasDates.enabled) {

        let interval = this.config.data.data[0].aggregations.clusters.buckets[1].key - this.config.data.data[0].aggregations.clusters.buckets[0].key;
        finalData = [this.config.data.data[0].aggregations.clusters.buckets.filter(v => (v.key >= this.startTime && v.key <= this.endTime) || (v.key + interval >= this.startTime && v.key + interval <= this.endTime))]

      } else finalData = [this.config.data.data[0].aggregations.clusters.buckets]

    } else {

      if (this.config.hasDates.enabled) finalData = [this.config.data.data[0].hits.hits.filter(v => v.sort[0] >= this.startTime && v.sort[0] <= this.endTime)]
      else finalData = [this.config.data.data[0].hits.hits]
    }

    return finalData

  }

  async createStats(data) {
    //get the remaining number of filtered data to show in "records processed"
    this.recordsCount = data[0].length;

    //get data for charts & stats tables based on the final filtered data
    if (data[0].length > 0) {

      if (this.pieParamIndx > -1 || this.barParamIndx > -1 || this.stackedParamIndx > -1 || this.barParamIndx2 > -1) {
        let chartsData = await this.statServ['createCharts_' + this.config.id](data)
        //this.chartsData = {...this.chartsData}
        this.pieData = chartsData.pieData;
        this.barData = chartsData.barData;
        this.barData2 = chartsData.barData2;
        this.stackedData = chartsData.stackedData;

        // if(flag == 'new'){
        //   //if the values in the bar charts are less than 3 -> reduce the default height. //only at the initialization of the charts (flag == new)
        //   if((this.barData && this.barData['data'].length < 3) || (this.stackedData && this.stackedData['data'].length < 3)) this.chartsHeight = 120
        // }

      }

      //sortedData variables are used to enable the sorting mechanism (check angular material sort headers)
      if (this.statsParams.length > 0) {
        let statsData = await this.statServ['createStats_' + this.config.id](data)

        this.stringData = statsData.stringData ? statsData.stringData : []
        this.sortedStringData = this.stringData.slice()
        this.numericData = statsData.numericData ? statsData.numericData : []
        this.sortedNumericData = this.numericData.slice()
      }


    } else {

      this.pieData = [];
      this.barData = [];
      this.barData2 = [];
      this.stackedData = [];
      this.numericData = [];
      this.stringData = [];

    }
  }




  userClickedStacked(event) {
    //console.log(event);

    if (event.series) {
      //console.log(event.series);
      this.dialog.open(SelectStatisticsComponent, {
        data: event.series, maxHeight: 'calc(100vh - 90px)'
      }).afterClosed().subscribe(returned => {

        if (returned == 'proceed') this.dataSync.changeClicked(event.series)

      })
    }
  }

  userClickedBar(event) {
    //console.log(event);

    if (this.config.id == 'globalAlerts') {

      //console.log(event.series);
      this.dialog.open(SelectStatisticsComponent, {
        data: event.name, maxHeight: 'calc(100vh - 90px)'
      }).afterClosed().subscribe(returned => {

        if (returned == 'proceed') this.dataSync.changeClicked(event.name)

      })


    }

  }




  sortData(sort: Sort, flag) {
    if (flag == 'string') {

      let data = this.stringData.slice();
      if (!sort.active || sort.direction === '') {
        this.sortedStringData = data;
        return;
      }

      this.sortedStringData = data.sort((a, b) => {
        const isAsc = sort.direction === 'asc';
        switch (sort.active) {
          case 'name':
            return this.compare(a.name, b.name, isAsc);
          case 'mostCommon':
            return this.compare(a.mostCommon, b.mostCommon, isAsc);
          case 'leastCommon':
            return this.compare(a.leastCommon, b.leastCommon, isAsc);
          case 'uniqueValues':
            return this.compare(a.uniqueValues, b.uniqueValues, isAsc);
          default:
            return 0;
        }
      });


    } else {

      let data = this.numericData.slice();
      if (!sort.active || sort.direction === '') {
        this.sortedNumericData = data;
        return;
      }

      this.sortedNumericData = data.sort((a, b) => {
        const isAsc = sort.direction === 'asc';
        switch (sort.active) {
          case 'name':
            return this.compare(a.name, b.name, isAsc);
          case 'lowestValue':
            return this.compare(a.lowestValue, b.lowestValue, isAsc);
          case 'highestValue':
            return this.compare(a.highestValue, b.highestValue, isAsc);
          case 'avgValue':
            return this.compare(a.avgValue, b.avgValue, isAsc);
          default:
            return 0;
        }
      });




    }


  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }



  ngOnDestroy() {

    if (this.periodSubscription) this.periodSubscription.unsubscribe();

  }





}
