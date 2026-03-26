import { animate, state, style, transition, trigger } from "@angular/animations";
import { AfterViewInit, Component, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, EventEmitter } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { DataSyncService } from "../../data-sync.service";
import { ExpandableDetailsService } from "./expandable-details.service";
import { Subscription } from "rxjs";
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


@Component({
  selector: 'app-expandable-details',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule,
    // BrowserAnimationsModule
  ],
  templateUrl: './expandable-details.component.html',
  styleUrls: ['./expandable-details.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class ExpandableDetailsComponent implements OnInit, AfterViewInit, OnChanges {

  @Input() config: any;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  dataSource = new MatTableDataSource();
  displayedColumns = [];
  nestedDisplayedColumns = [];
  columnsToDisplayWithExpand = [];
  tableData = [];
  tableExist = false;
  startTime;
  endTime;
  periodSubscription: Subscription;
  @Output() loading = new EventEmitter<any>();

  constructor(
    private dataSync: DataSyncService,
    private expandDetailsService: ExpandableDetailsService,
    public dialog: MatDialog
  ) {

  }

  ngOnInit(): void {

  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  async ngOnChanges(changes: SimpleChanges) {
    //console.log(changes)

    if (changes.config && this.config) {
      this.loading.emit('start')

      this.tableData = [];
      this.dataSource.data = [];

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

        //build data in tabular format
        this.tableData = await this.expandDetailsService['createData_' + this.config.id](this.config.data.data)
        // console.log(this.tableData,'tableDATA in ts')
        this.dataSource.data = this.tableData;
        //whenever new data derived, check if table exist -> if no, first load of view/dash or wgt dragged into view from avail. widgets.
        //-> in either scenario, set start,end datatimes to default values from config/dashboard. if zoomSync is enabled, details comp will subscribe to periodSubscription below and will sync with the current time-window.(if any from other time-wise synced wdgts)

        if (!this.tableExist) {

          //get column names if they were provided through config or build them in service.
          if (this.config.columns) {
            this.displayedColumns = this.config.columns
          }
          else {
            this.displayedColumns =
              await this.expandDetailsService['createColumns_' + this.config.id](this.tableData);
            this.nestedDisplayedColumns =
              await this.expandDetailsService['createNestedColumns_' + this.config.id](this.tableData);
          }
          // console.log(this.displayedColumns, 'Primary')
          // console.log(this.nestedDisplayedColumns, 'nested')
          this.columnsToDisplayWithExpand = [...this.displayedColumns, 'expand'];

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
            // console.log(this.config.data.action, 'this.config.data.action');
            //create again columns because volume or kind of data may have been changed on new request from back-end
            if (this.config.columns) {
              this.displayedColumns = this.config.columns;
            }
            else {
              this.displayedColumns =
                await this.expandDetailsService['createColumns_' + this.config.id](this.config.data.data);
            }
            this.columnsToDisplayWithExpand = [...this.displayedColumns, 'expand'];
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
        if (error !== 'first') console.log(error);
        //this.loading.emit('done')

      })


    }

  }


  finalFilter() {


    //we assume that if dataset has dates, then timestamps should be in a field called "timestamp". (data created at details service)
    if (this.config.hasDates.enabled) {

      if (!this.config.data.data[0]?.hits) {

        this.dataSource.data = this.tableData.filter(v => (v.end.getTime() >= this.startTime && v.end.getTime() <= this.endTime) || (v.start.getTime() >= this.startTime && v.start.getTime() <= this.endTime))

      } else this.dataSource.data = this.tableData.filter(v => (v.timestamp.getTime() >= this.startTime && v.timestamp.getTime() <= this.endTime))

    } else this.dataSource.data = this.tableData

  }

}