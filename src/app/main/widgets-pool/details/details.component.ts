import { MatTableDataSource } from '@angular/material/table';
import { Component, ViewChild, OnInit, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { DataSyncService } from '../../data-sync.service';
import { DetailsService } from './details.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { SelectDetailsComponent } from '../dialogs/select-details/select-details.component';


@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent implements OnInit {

  @Input() config: any;
  @Output() loading = new EventEmitter<any>();

  tableData = [];
  tableExist = false;
  startTime;
  endTime;

  //subs flag
  periodSubscription: Subscription;

  displayedColumns = [];
  dataSource = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private dataSync: DataSyncService,
    private detailsServ: DetailsService,
    public dialog: MatDialog
  ) {

  }

  ngOnInit(): void {

  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }


  async ngOnChanges(changes: SimpleChanges) {
    //console.log(changes)

    if (changes.config && this.config) {
      this.loading.emit('start')

      this.tableData = [];
      this.dataSource.data = [];

      const promise = new Promise<void>((resolve, reject) => {
        // console.log(this.config);

        if (this.config.data.data.length > 0) {

          resolve()

        } else reject('no-data')

      })

      promise.then(async () => {

        //build data in tabular format
        this.tableData = await this.detailsServ['createData_' + this.config.id](this.config.data.data)
        //whenever new data derived, check if table exist -> if no, first load of view/dash or wgt dragged into view from avail. widgets.
        //-> in either scenario, set start,end datatimes to default values from config/dashboard. if zoomSync is enabled, details comp will subscribe to periodSubscription below and will sync with the current time-window.(if any from other time-wise synced wdgts)

        if (!this.tableExist) {

          //get column names if they were provided through config or build them in service.
          if (this.config.columns) this.displayedColumns = this.config.columns
          else this.displayedColumns = await this.detailsServ['createColumns_' + this.config.id](this.config.data.data)


          this.startTime = this.config.start;
          this.endTime = this.config.end;

          //if zoomSync, then hasDates is also enabled. -> listen to zoom changes from other widgets & filter our data.
          if (this.config.hasDates.zoomSync && (!this.periodSubscription || this.periodSubscription.closed)) {

            this.periodSubscription = this.dataSync.currentPeriod.subscribe((incomingZoom) => {
              //console.log(incomingZoom , 'in Details')

              //if data exist and a valid incomingZoom came from an other widget.
              //reminder: at initilization of the dashboard, behaviorSubject (dataSync service) has an empty array (length == 0)
              if ((this.tableData && incomingZoom.length == 3) && (this.startTime !== incomingZoom[0] || this.endTime !== incomingZoom[1])) {

                //console.log('mpike zoom details');

                this.startTime = incomingZoom[0]
                this.endTime = incomingZoom[1]

                this.finalFilter();

              }

            })
          }


        } else {

          //if table exist ->  update the start,end & columns ONLY when new data from back-end request derived.
          if (this.config.data.action == 'new') {

            //create again columns because volume or kind of data may have been changed on new request from back-end
            if (this.config.columns) this.displayedColumns = this.config.columns
            else this.displayedColumns = await this.detailsServ['createColumns_' + this.config.id](this.config.data.data)

            this.startTime = this.config.start;
            this.endTime = this.config.end;
          }

        }

        //always go though final filter -> filter timestamps if exist & add final data to the MatDataSource
        await this.finalFilter();

        this.tableExist = true;

        setTimeout(() => {
          this.loading.emit('done')
        }, 600);


      }, (error) => {
        console.log(error);
        //this.loading.emit('done')

      })


    }

  }


  finalFilter() {


    //we assume that if dataset has dates, then timestamps should be in a field called "timestamp". (data created at details service)
    if (this.config.hasDates.enabled) {
      //console.log(this.config)
      if (!this.config.data.data[0].hits) {
        this.dataSource.data = this.tableData.filter(v => (v.end.getTime() >= this.startTime && v.end.getTime() <= this.endTime) || (v.start.getTime() >= this.startTime && v.start.getTime() <= this.endTime))
        //console.log(this.dataSource.data[0]['start'].getTime());
      } else  this.dataSource.data = this.tableData.filter(v => v.timestamp.getTime() >= this.startTime && v.timestamp.getTime() <= this.endTime)

    } else this.dataSource.data = this.tableData


  }


  //make click on table dynamic #TOTHINK #TODO
  assetIdClicked(assetID) {

    if (assetID) {

      this.dialog.open(SelectDetailsComponent, {
        data: assetID, maxHeight: 'calc(100vh - 90px)'
      }).afterClosed().subscribe(returned => {

        if (returned == 'proceed') this.dataSync.changeClicked(assetID)

      })
    }

  }


  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }


  ngOnDestroy() {
    if (this.periodSubscription) this.periodSubscription.unsubscribe();
  }

}
