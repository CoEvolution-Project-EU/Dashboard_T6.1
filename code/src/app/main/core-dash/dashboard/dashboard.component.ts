import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDrawer } from '@angular/material/sidenav';
import { NgxSpinnerService } from "ngx-spinner";
import { ActivatedRoute } from '@angular/router';
import { NodejsDataService } from '../../nodejs-data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { animate, style, transition, trigger } from '@angular/animations';
import { DashboardService } from './dashboard.service';
import { DataSyncService } from '../../data-sync.service';
import { ResizeEvent } from 'angular-resizable-element';
import { MatDialog } from '@angular/material/dialog';
import { InspectDialogComponent } from '../inspect-dialog/inspect-dialog.component';
import { Subscription } from 'rxjs';
// import { SocketioService } from '../../socketio.service';
import { CasesOverviewService } from '../../cases/cases-overview/cases-overview.service';
import { ReportPdfService } from 'src/app/shared/report-pdf.service';
import JSZip from 'jszip';
import * as FileSaver from 'file-saver';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Angular Material Modules
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatTimepickerModule } from '@angular/material/timepicker';

// Third-Party Modules
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgSelectModule } from '@ng-select/ng-select';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ResizableModule } from 'angular-resizable-element';

// Custom Components
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { TimelineComponent } from '../../widgets-pool/timeline/timeline.component';
import { LineChartComponent } from '../../widgets-pool/line-chart/line-chart.component';
import { DetailsComponent } from '../../widgets-pool/details/details.component';
import { StatisticsComponent } from '../../widgets-pool/statistics/statistics.component';
import { DistributionComponent } from '../../widgets-pool/distribution/distribution.component';
import { NetworkGraphComponent } from '../../widgets-pool/network-graph/network-graph.component';
import { ExpandableDetailsComponent } from '../../widgets-pool/expandable-details/expandable-details.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  providers: [
    provideNativeDateAdapter()
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NgxSpinnerModule,
    NgSelectModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSidenavModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatInputModule,
    MatDatepickerModule,
    MatDialogModule,
    NavbarComponent,
    TimelineComponent,
    DetailsComponent,
    StatisticsComponent,
    DistributionComponent,
    LineChartComponent,
    NetworkGraphComponent,
    ExpandableDetailsComponent,
    DragDropModule,
    MatDatepickerModule,
    MatTimepickerModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    ResizableModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [   // :enter is alias to 'void => *'
        style({ opacity: 0 }),
        animate(500, style({ opacity: 1 }))
      ]),
      transition(':leave', [   // :leave is alias to '* => void'
        animate(0, style({ opacity: 0 }))
      ])
    ])
  ]
})

export class DashboardComponent implements OnInit {

  currentWidgets = [];
  availableWidgets = [];
  allWidgets = [];

  assets;
  assets_options = [];

  syncFlag = true;

  startPeriod;
  endPeriod;
  zoomStart;
  zoomEnd;

  promises = [];
  preconfViewTimewindow;
  preconfViewLoaded;

  datasetsDataMap = new Map();
  datasetsFilteredDataMap = new Map();
  datasetsActiveMap = new Map();
  asset_id;
  inspect_assets;


  //--------URL PARAMS
  preconfViewId;
  assetId;
  //--------

  //--------datasets QUERY FILTERS - use EXACT the same names as for the query api calls - REQUIRED. #TOUCH
  //these should have the filter values exposed in the front-end for the corresponding query params.
  severities;

  //---------

  //#TOUCH
  //--------create variables with the same name + "_options" suffic for range & validation needs. (e.g sverity filter needs a dropdown with 1 - 10 available options, cpu valid range is 0-100 etc.)
  severities_options = []

  //---------

  //--------LOCAL FILTERS - same logic as above. #TOUCH


  alertName = []
  alertName_options = []

  entities = []
  entities_options = []

  strictSearch;

  recentSaved;

  // channels
  // channels_options
  // servers
  // servers_options
  // responses
  // responses_options
  //---------

  //sliderCpuOpts: Options;
  periodSubscription: Subscription;
  clickedSubscription: Subscription;
  socketSubscription: Subscription;

  heightResized = {}

  pdfreport_list = []
  jsonFiles_list = []

  token;

  isCollapsed = false;
  isWidgetsCollapsed = true;
  readonly openWidth = 240;
  readonly collapsedWidth = 60;

  @ViewChild('drawer', { static: true }) filterBar: MatDrawer;
  @ViewChild('network') network: ElementRef;
  @ViewChild('picker') picker;
  @ViewChild('picker2') picker2;
  // for downloading the pdf report you need to set the elementRef of the widget
  // it must be same name as the .name in the config file
  // #TOUCH 
  @ViewChild('alertsDistrib', { read: ElementRef, static: false }) alertsDistrib!: ElementRef;
  @ViewChild('timeline', { read: ElementRef, static: false }) timeline!: ElementRef;
  @ViewChild('alertsDetails', { read: ElementRef, static: false }) alertsDetails!: ElementRef;
  @ViewChild('alertsStats', { read: ElementRef, static: false }) alertsStats!: ElementRef;
  @ViewChild('uncommonDetails', { read: ElementRef, static: false }) uncommonDetails!: ElementRef;
  @ViewChild('loginDetails', { read: ElementRef, static: false }) loginDetails!: ElementRef;
  @ViewChild('processDetails', { read: ElementRef, static: false }) processDetails!: ElementRef;
  // @ViewChild('communicationDetails', { read: ElementRef, static: false }) communicationDetails!: ElementRef;

  @ViewChild('lineCPU', { read: ElementRef, static: false }) lineCPU!: ElementRef;
  @ViewChild('lineAP', { read: ElementRef, static: false }) lineAP!: ElementRef;
  @ViewChild('lineMemory', { read: ElementRef, static: false }) lineMemory!: ElementRef;
  @ViewChild('lineNetwork', { read: ElementRef, static: false }) lineNetwork!: ElementRef;
  @ViewChild('expandableDetails', { read: ElementRef, static: false }) expandableDetails!: ElementRef;


  constructor(
    private spinner: NgxSpinnerService,
    private actRoute: ActivatedRoute,
    private nodejsService: NodejsDataService,
    private _snackBar: MatSnackBar,
    private dashServ: DashboardService,
    private dataSync: DataSyncService,
    public dialog: MatDialog,
    // private socketService: SocketioService,
    // private router: Router,
    private overviewService: CasesOverviewService,
    private reportservice: ReportPdfService


  ) {

    this.spinner.show();
    this.token = this.nodejsService.getToken();
    this.getAssetDetails()
    //get any ids/params etc from the url
    this.assetId = this.actRoute.snapshot.params.id;
    this.preconfViewId = this.actRoute.snapshot.params.preconfView;
  }

  async ngOnInit() {

    try {
      // Get token first
      this.token = await this.nodejsService.getToken();

      //get preconfigured view - transmitted through resolver.
      this.actRoute.data.subscribe(async resolverResp => {



        if (!(resolverResp.data.preconfView)) {
          this.spinner.hide()
          this._snackBar.open('An error has occured. Please try again.', null, { duration: 3500, panelClass: 'errorClass' })
        } else {

          await this.getAssetDetails();

          this.preconfViewLoaded = resolverResp.data.preconfView;

          //set widgets from prec view
          this.allWidgets = this.preconfViewLoaded.currentWidgets.concat(this.preconfViewLoaded.availableWidgets);

          this.allWidgets.forEach(w => {
            //add all widgets ids to the heightResized obj, so to send dynamically resize events for the resizable ones.
            this.heightResized[w.name] = {};

            if (this.preconfViewLoaded.currentWidgets.some(wi => wi.name == w.name)) this.currentWidgets.push(w)
            else this.availableWidgets.push(w)
          })


          this.currentWidgets.sort((a, b) => (a.order > b.order) ? 1 : -1);

          //if the core-dash was loaded through 'Investigate Assets' functionality in 'Events Analysis' screen -> get the start/end Period that user chose.
          if (Object.keys(this.actRoute.snapshot.queryParams).length > 0) {

            //we assume for now, that queryParams will only contain the start & end period as timestamps.
            this.preconfViewTimewindow = [Number(this.actRoute.snapshot.queryParams.sp), Number(this.actRoute.snapshot.queryParams.ep)]

            this.startPeriod = new Date(this.preconfViewTimewindow[0])
            this.endPeriod = new Date(this.preconfViewTimewindow[1])

          } else {

            //else set timewindow from prec view
            this.preconfViewTimewindow = this.preconfViewLoaded.timewindow;

            if (this.preconfViewTimewindow == 'last24h') {
              this.startPeriod = new Date(Date.now() - 86400000);
              this.endPeriod = new Date(Date.now());
            } else if (this.preconfViewTimewindow == 'lastweek') {
              this.startPeriod = new Date(Date.now() - 604800000);
              this.endPeriod = new Date(Date.now());
            } else if (this.preconfViewTimewindow == 'lastmonth') {
              this.startPeriod = new Date(Date.now() - 2592000000);
              this.endPeriod = new Date(Date.now());
            } else {
              this.startPeriod = new Date(this.preconfViewTimewindow[0])
              this.endPeriod = new Date(this.preconfViewTimewindow[1])
            }

          }


          //for each dataset exist in pre conf - add to ActiveMap -  & apply all values from filterParams/localFilters(if any) to the local variables  - !SAME NAMES!
          this.preconfViewLoaded.datasets.forEach(dataset => {

            //pass the dataset (as is) to the Active Map with the "id" field as key in Map.
            this.datasetsActiveMap.set(dataset.id, dataset)

            //if there are filterParams -> get the filterParams key,value as pairs.
            //pass each value of the filterParams from the preconf view to the local vars that have SAME names.
            Object.entries(dataset.filterParams).forEach(keyvalue => {

              //good2know: by using syntax like "this['someValue']" in typescript -> if for example 'someValue' == channel , typecript will search for this.channel local var. Thus, we can call dynamically loca vars.
              this[keyvalue[0]] = JSON.parse(JSON.stringify(keyvalue[1]));

              //pass the known range/options of params.
              //note that we have named these local vars SAME as the params + '_options' suffix.
              //good2know: this JSON.parse/JSON.stringify trick will hard copy multi-nested objs/arrays.

              if (dataset.filterParams_options && dataset.filterParams_options[keyvalue[0] + '_options']) {
                this[keyvalue[0] + '_options'] = JSON.parse(JSON.stringify(dataset.filterParams_options[keyvalue[0] + '_options']))
              }


            })

            //if there are localFilters -> set to our local vars with the values from preconf view. (SAME names)
            Object.entries(dataset.localFilters).forEach(keyvalue => {
              this[keyvalue[0]] = JSON.parse(JSON.stringify(keyvalue[1]));
            })



          })


          //until here
          //-> Widgets were set
          //-> Start & End datetimes were set
          //-> Query Filters active values were set
          //-> Query Filters known/available options were set
          //-> 'datasetsActiveMap' was set. (stored the preconf datasets + values - as is)
          //-> if localFilters/filterParams in datasets -> active values were set.


          //------------------set any front-end filter fields/options here. #TOUCH
          // add forms + validators here based on the '_options' of each param #TODO


          // if(this.datasetsActiveMap.has('metrics')){
          //   this.sliderCpuOpts = {
          //     floor: this.cpuUs_options[0],
          //     ceil: this.cpuUs_options[1],
          //     translate: (value: number, label: LabelType): any => {
          //       return value + '%';
          //       // switch (value) {
          //       //   case this.sliderCpuOpts.ceil:
          //       //     return '45+';
          //       //   default:
          //       //     return value;
          //       // }
          //       }
          //     };
          //   }

          //-----------------------------------------------------------------

          this.initData('first')


        }

      })
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      this.spinner.hide();
      this._snackBar.open('Authentication failed. Please log in again.', null, { duration: 3500, panelClass: 'errorClass' });
    }


    // if (!this.socketSubscription || this.socketSubscription.closed) {
    //   this.socketSubscription = this.socketService.liveData().subscribe(res => {

    //     if (res && this.actRoute.params['_value'].preconfView !== res) {

    //       this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
    //         this.router.navigate(['/assets-overview/assets-list/dashboards/core-dash/' + this.actRoute.params['_value'].id + '/' + res]);
    //       });
    //     }

    //   })
    // }


    if (!this.periodSubscription || this.periodSubscription.closed) {

      this.periodSubscription = this.dataSync.currentPeriod.subscribe((incomingZoom) => {
        if (incomingZoom.length == 3) {
          this.zoomStart = incomingZoom[0]
          this.zoomEnd = incomingZoom[1]
        } else {

          this.zoomStart = new Date(this.startPeriod).getTime()
          this.zoomEnd = new Date(this.endPeriod).getTime()
        }
      })
    }

    if (this.assetId == 'all' && (!this.clickedSubscription || this.clickedSubscription.closed)) {

      this.clickedSubscription = this.dataSync.currentClicked.subscribe((assetID) => {

        if (assetID) {
          this.assets = assetID

        }
      })

    }


  }


  inspectAssets() {

    this.dialog.open(InspectDialogComponent, {
      data: { "selected": this.assets, zoomedPeriod: [this.zoomStart, this.zoomEnd], period: [new Date(this.startPeriod).getTime(), new Date(this.endPeriod).getTime()] }, maxHeight: 'calc(100vh - 90px)'
    })

  }

  updatePeriod() {

    this.startPeriod = new Date(this.zoomStart)
    this.endPeriod = new Date(this.zoomEnd)

  }


  downloadReport() {

    this.preconfViewLoaded.currentWidgets.forEach(dataset => {

      if (dataset.pdfreport?.info && this[dataset.name]?.nativeElement) {
        this.pdfreport_list.push({ "element": this[dataset.name].nativeElement, "options": dataset.pdfreport })
      }
    })

    const currentRef = this.pdfreport_list;
    this.reportservice.exportHtml(currentRef, this.assetId, this.preconfViewLoaded.title);

  }



  downloadJson() {

    this.allWidgets.forEach(widget => {
      this.jsonFiles_list.push({ "widget": widget.title, "data": widget.config.data.data })
    })

    this.convertToJson_download(this.jsonFiles_list, this.preconfViewLoaded.title, this.assetId);
  }

  convertToJson_download(myArray: any[], useCase: string, asset: string) {
    let zip = new JSZip();
    myArray.forEach(v => {
      zip.file(v.widget + '.json', JSON.stringify(v.data));
    });

    zip.generateAsync({ type: "blob" })
      .then(function (content) {
        FileSaver.saveAs(content, asset + "_" + useCase + ".zip");
      });
  }


  async getAssetDetails(): Promise<void> {
    try {
      // Make sure token exists before trying to use it
      if (!this.token) {
        this.token = await this.nodejsService.getToken();
      }

      this.assets_options = await this.overviewService.getAssets(this.token, '/assets', {
        "start": 1695723177000,
        "end": new Date(Date.now()).getTime()
      });
      if (this.assets_options[0] == 'http-error') {
        this._snackBar.open('An error has occurred while trying to retrieve cases. Please try again.', null, { duration: 3500, panelClass: 'errorClass' });
      } else {

        if (this.assetId !== 'all')
          this.asset_id = this.assets_options.filter(v => v.hostname == this.assetId)[0]['host_id'];
        else {
          this.asset_id = this.assets_options.map(v => v.host_id)
          this.inspect_assets = this.assets_options.map(v => v.hostname)

        }
        this.recentSaved = this.assets_options.map(asset => asset.savedViews).filter(v => v);
      }
    } catch (error) {
      console.error('Error getting asset details:', error);
      this._snackBar.open('Failed to load asset details. Please refresh the page or log in again.', null, { duration: 3500, panelClass: 'errorClass' });
    }
  }


  //this function is getting called each time new data from the backend are being requested.
  initData(flag) {
    this.spinner.show();
    this.promises = [];
    //per new data request, clear zoomed period
    this.dataSync.changePeriod([])
    //clear inspection field
    this.assets = null;

    //for each active Dataset -> build the body request.

    for (let value of this.datasetsActiveMap.values()) {
      let body = {};

      //if the dataset needs dynamic id (i.e. a clicked asset) -> we add it in body as 'id' for all requests.
      //-> go to the corresponding nodejsService function and map this to the correct name for each request. (e.g an api may needs id as "cardID", so you have to take it from body.id)
      if (value.hasDynamicID) {
        body['id'] = Array.isArray(this.asset_id) ? this.asset_id : [this.asset_id]
      }
      //add to body any static params (if any) that the request requires.
      if (Object.keys(value.staticParams).length > 0) {

        Object.entries(value.staticParams).forEach(keyvalue => {
          body[keyvalue[0]] = keyvalue[1]
        })
      }


      //On reset we will use the inital param filter values from the preconf view that are already stored in the datasetsActiveMap.
      if (flag == 'reset') {

        //On reset if dataset requires dates -> check timewindow's value that was initially loaded from prec view.
        if (value.hasDates) {

          if (this.preconfViewTimewindow == 'last24h') {
            this.startPeriod = new Date(Date.now() - 86400000);
            this.endPeriod = new Date(Date.now());
          } else if (this.preconfViewTimewindow == 'lastmonth') {
            this.startPeriod = new Date(Date.now() - 2592000000);
            this.endPeriod = new Date(Date.now());
          } else if (this.preconfViewTimewindow == 'lastweek') {
            this.startPeriod = new Date(Date.now() - 604800000);
            this.endPeriod = new Date(Date.now());
          } else {
            this.startPeriod = new Date(this.preconfViewTimewindow[0])
            this.endPeriod = new Date(this.preconfViewTimewindow[1])
          }

          //set start & end values since these are not included (inside the filterParams) in preconf.
          //we add the start,end timestamps as 'start','end' for all requests that need timestamps.
          // -> go to the corresponding nodejsService function and map these to the correct names for each request. (e.g an api may needs start period as "dateStartsAt", so you have to take it from body.start )
          body['start'] = this.startPeriod.getTime();
          body['end'] = this.endPeriod.getTime();

        }

        //add to body keys and values same as the filterParams from preconf.
        //set to the local variables the initial values as well.
        //good2know: by using syntax to objects like " body['example'] = 'testValue' " -> 'example' key will be created if it's not already included.
        Object.entries(value.filterParams).forEach(keyvalue => {
          body[keyvalue[0]] = keyvalue[1]
          this[keyvalue[0]] = JSON.parse(JSON.stringify(keyvalue[1]))
        })


      } else {

        //on first/new request add the current values from calendar filter/fields.
        if (value.hasDates) {

          body['start'] = new Date(this.startPeriod).getTime();
          body['end'] = new Date(this.endPeriod).getTime();

        }

        //add to body keys same as the filterParams from preconf.
        //set values with the current selections of the user (Query Filters)
        Object.keys(value.filterParams).forEach(paramName => {
          body[paramName] = this[paramName]

        })

      }



      if (value.path) this.promises.push(this.nodejsService[value.method](value.path, body))
    }

    //until here
    //-> Requests for all apis/datasets services were set.
    //-> On reset, dates & param filters filled with the inital values (from preconf view).


    Promise.all(this.promises).then(async (results) => {


      //data returned from the apis with the same order as the promises were pushed.
      //on reset/new request clear local filters #TOUCH
      //on first request, we dont clear the local filters input because the preconf may were contain values.
      if (flag !== 'first') {
        // this.alertName = this.alertName_options

        this.entities = [];

      }

      let i = 0;


      //re-build the local filter range/options and store-update the new-came data for each dataset to the datasetsDataMap.
      for (let [key, value] of this.datasetsActiveMap.entries()) {


        this.datasetsDataMap.set(key, results[i])



        if (Object.keys(value.localFilters).length > 0) {

          //calling a service per dataset that has localFilters, so to build the options based on the new data.
          //the service should return EXACT the same format of the localFilters_options field (in preconf).
          //good2know: Promise.all will return an array with the results of the promises in the SAME order as were pushed. Thus, we know the order.
          // *EDO
          let localFilters_options = await this.dashServ['createLocalFilt_' + key](results[i]);

          //update the values of the '_options' vars with the new ones.
          Object.entries(localFilters_options).forEach(keyvalue => {
            this[keyvalue[0]] = keyvalue[1];

            // this[keyvalue[0]] = [...new Set(this[keyvalue[0]].push(keyvalue[1]))];
            //why?
          })

          let localFiltersActive = {};

          //build the localFiltersActive object with the current values of the local filters.
          Object.keys(value.localFilters).forEach(name => {

            localFiltersActive[name] = this[name]

          })



          //call a service per dataset that has localFilters, to filter the data based on the user selection (local filters current values)
          let filteredData = await this.dashServ['filterDataset_' + key](localFiltersActive, results[i])

          //store the filtered data to a new Map obj (datasetsFilteredDataMap), in order to not erase the original data from datasetsDataMap.          //in datasetsDataMap we keep the un-filtered data, as a full-daset for filtering.          console.log(value.localFilters, localFiltersActive, filteredData);

          this.datasetsFilteredDataMap.set(key, filteredData)


        }

        i++


      }

      //until here
      //-> new-came data were stored in datasetsDataMap for each dataset.
      //-> if dataset contains localFilters, localFilters_options were set based on the new-came data.
      //-> if dataset contains localFIlters, data were filtered and set in datasetsFilteredDataMap.
      // if (this.datasetsDataMap.has('netflows')) {

      //   if (!this.datasetsDataMap.get('netflows').hits) {

      //     if (this.currentWidgets.some(v => v.name == 'network')) {

      //       let netWdgt = this.currentWidgets.find(v => v.name == 'network')
      //       netWdgt.disabled = true;

      //       this.currentWidgets = this.currentWidgets.filter(w => w.name !== 'network')
      //       this.availableWidgets.push(netWdgt)

      //     } else {

      //       let indx = this.availableWidgets.findIndex(w => w.name == 'network')
      //       this.availableWidgets[indx].disabled = true;

      //     }

      //   } else {

      //     if (this.availableWidgets.some(v => v.name == 'network')) {

      //       let indx = this.availableWidgets.findIndex(w => w.name == 'network')
      //       this.availableWidgets[indx].disabled = false;


      //       if (this.preconfViewLoaded.currentWidgets.some(w => w.name == 'network')) {

      //         this.currentWidgets.push(this.availableWidgets[indx])
      //         this.availableWidgets = this.availableWidgets.filter(w => w.name !== 'network')

      //       }

      //     }

      //   }


      // }


      //check the datasets that each widget requires (datasets field in widget object) -> get the data from the Maps that we have created above.
      this.allWidgets.forEach(widget => {
        let finalData = { action: "new", data: [], extra: [] };

        //datasets field in every widget contain the "id" value of each datasets, so we can get the data from the Map with the "get" method since the "id" is the key of the Maps for every entry.
        widget.datasets.forEach(datName => {

          if (this.datasetsFilteredDataMap.has(datName)) {


            finalData.data.push(this.datasetsFilteredDataMap.get(datName))
            let localFilters = {}

            Object.keys(this.datasetsActiveMap.get(datName).localFilters).forEach(f => {
              localFilters[f] = this[f]
            })

            finalData.extra.push(localFilters)
          }
          else finalData.data.push(this.datasetsDataMap.get(datName))


        })


        //udpdate the config of each widget.
        widget.config.data = finalData;
        widget.config.start = new Date(this.startPeriod).getTime();
        widget.config.end = new Date(this.endPeriod).getTime();

        //trigger change detection for objects
        widget.config = Object.assign({}, widget.config);


      })

      if (flag === 'reset') {
        await this.applyFilters('clear-all');
      } else
        await this.applyFilters('apply-all');

    })



  }



  async applyFilters(flag) {

    this.spinner.show();

    //apply-all,clear-all are reffered to all datasets with filters.
    if (flag == 'apply-all' || flag == 'clear-all') {

      //on clear -> clear the local filters #TOUCH
      if (flag == 'clear-all') {
        this.alertName = [...this.alertName_options]
        this.entities = []
        //this.strictSearch = false;
      }

      //find datasets that have localFilters -> get the values from the local filters & filter the data.
      for (let [key, value] of this.datasetsActiveMap.entries()) {
        if (Object.keys(value.localFilters).length > 0) {

          let localFiltersActive = {};

          //create an object with the local filters and the current(user's selections or empty on reset) values for each dataset.
          Object.keys(value.localFilters).forEach(name => {
            localFiltersActive[name] = this[name]
          })


          //get the filtered data
          let filteredData = await this.dashServ['filterDataset_' + key](localFiltersActive, this.datasetsDataMap.get(key))
          //update datasetsFilteredDataMap
          this.datasetsFilteredDataMap.set(key, filteredData)

        }
      }

      //check which widgets need datasets that contain localFilters & send the filtered data that we updated above.
      this.allWidgets.forEach(widget => {

        //the datasetsFilteredDataMap has all the datasets' data that were filtered.
        //reminder: we use the 'id' of the datasets as keys for all Maps & in 'datasets' field in widgets objects.
        if (widget.datasets.some(datasetID => this.datasetsFilteredDataMap.has(datasetID))) {

          let finalData = { action: "filter", data: [], extra: [] };

          //if the widget uses a dataset that has localfilters, we update the "data" field in config so to send again the new data.
          //note that a widget may uses data from more than one datasets and some of them may include localfilters while some others not.
          //thus, we need to send all the required data (filtered from datasetsFilteredDataMap & non-filtered data from datasetsDataMap for the datasets that have no localFilters.)  )
          widget.datasets.forEach(datName => {


            if (this.datasetsFilteredDataMap.has(datName)) {

              finalData.data.push(this.datasetsFilteredDataMap.get(datName))
              let localFilters = {}

              Object.keys(this.datasetsActiveMap.get(datName).localFilters).forEach(f => {
                localFilters[f] = this[f]
              })

              finalData.extra.push(localFilters)
            }
            else finalData.data.push(this.datasetsDataMap.get(datName))
          })

          widget.config.data = finalData;
          widget.config = Object.assign({}, widget.config);

        }

      })



    } else {
      //if the user wants to filter specific dataset
      //the flag contains the id of the dataset.

      //find the dataset
      let selectedDataset = this.datasetsActiveMap.get(flag)

      //filter only the data for this dataset & update datasetsFilteredDataMap
      let localFiltersActive = {};

      Object.keys(selectedDataset.localFilters).forEach(name => {
        localFiltersActive[name] = this[name]
      })

      let filteredData = await this.dashServ['filterDataset_' + flag](localFiltersActive, this.datasetsDataMap.get(flag))
      this.datasetsFilteredDataMap.set(flag, filteredData);

      //find all the widgets that use this dataset & send the new filtered data
      this.allWidgets.forEach(widget => {

        if (widget.datasets.some(dataset => dataset == flag)) {

          let finalData = { action: "filter", data: [] };

          widget.datasets.forEach(dataset => {
            if (dataset == flag) finalData.data.push(this.datasetsFilteredDataMap.get(dataset))
            else finalData.data.push(this.datasetsDataMap.get(dataset))
          })

          widget.config.data = finalData;
          widget.config = Object.assign({}, widget.config);

        }
      })
    }
  }



  // trigger spinner from widgets
  getSpinner(flag) {
    if (flag == 'start') this.spinner.show()
    else this.spinner.hide()
  }
  //syncFlag is served as Input to the other components, -> if false, all time-wise widgets wont propagate the zoom interactions to the dataSync service.
  syncWidgets() {
    this.syncFlag = !this.syncFlag;
  }

  //move widgets func
  drop(event: CdkDragDrop<any[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      event.previousContainer.data.forEach((x, index) => {
        x.order = index
      })
    }

    event.container.data.forEach((x, index) => {
      x.order = index
    })

    if (this.currentWidgets.length == 0) this.filterBar.close();

  }

  resizeW(size, name) {

    let i = this.currentWidgets.findIndex(v => v.name == name)
    this.currentWidgets[i].size = size

  }

  onResizeEnd(event: ResizeEvent, wdgt): void {
    if (event.rectangle.height >= 200) this.heightResized[wdgt] = event.rectangle.height
  }

  toggleFiltersSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleWidgetsSidebar(): void {
    this.isWidgetsCollapsed = !this.isWidgetsCollapsed;
  }

  get leftMargin(): number {
    return this.isCollapsed ? this.collapsedWidth : this.openWidth;
  }
  get rightMargin(): number {
    return this.isWidgetsCollapsed ? this.collapsedWidth : this.openWidth;
  }

  ngOnDestroy() {

    if (this.periodSubscription) this.periodSubscription.unsubscribe();
    if (this.clickedSubscription) this.clickedSubscription.unsubscribe();
    if (this.socketSubscription) this.socketSubscription.unsubscribe();

    this.dataSync.changeClicked("")

    // this.socketService.disconSocket();

    // this.alldatasets.forEach(d => d.active = false);
    // this.currentWidgets = [];
    // this.availableWidgets = [];
    // this.datasetsDataMap.clear();
  }
}

