import { Component, ElementRef, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { DataSet } from 'vis-data/peer';
import { Timeline } from 'vis-timeline/peer';
import { DataSyncService } from '../../data-sync.service';
// import { MatSnackBar } from '@angular/material/snack-bar';
import { TimelineService } from './timeline.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { DoubleclickTimelineComponent } from 'src/app/main/widgets-pool/dialogs/doubleclick-timeline/doubleclick-timeline.component';
import { ActivatedRoute } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [   // :enter is alias to 'void => *'
        style({ opacity: 0 }),
        animate(500, style({ opacity: 1 }))
      ]),
      transition(':leave', [   // :leave is alias to '* => void'
        animate(500, style({ opacity: 0 }))
      ])
    ])
  ]
})
export class TimelineComponent implements OnInit {
  @Input() config: any;
  @Input() heightResized: any;
  @Input() syncFlag: boolean;

  @Output() loading = new EventEmitter<any>();

  @ViewChild('timeline', { static: true }) timelineContainer: ElementRef;

  items = [];
  groups = [];
  finalItems = new DataSet([]);
  finalGroups = new DataSet([]);

  timeline: any;
  showLabels = true;
  showGroups = false;

  timelineOptions: any = {
    //showMajorLabels: false,
    //showMinorLabels: false,
    clickToUse: true,
    //configure:true,
    zoomKey: 'ctrlKey',
    horizontalScroll: true,
    //preferZoom: true,
    orientation: 'top',
    //verticalScroll: true,
    showCurrentTime: false,
    //height: this.config.height,
    template: (a, b, g) => {
      //console.log(a, b, g)
      if (g.isCluster) {

        //let iclass;
        //console.log(g)
        //let itemClass = g.items[0].className;
        // iclass = itemClass;

        // switch (itemClass) {
        //   case 'low':
        //     iclass = 'lowCluster'
        //     break;
        //   case 'medium':
        //     iclass = 'mediumCluster'
        //     break;
        //   case 'high':
        //     iclass = 'highCluster'
        //     break;
        //   case 'critical':
        //     iclass = 'criticalCluster'
        //     break;
        // }

        return this.htmlTitle(g.items.length,  g.items[0].legendMatch)

      } else return a.content

    },
    cluster: {
      maxItems: 10,
      clusterCriteria: ((a, b) => {
        console.log(a, b)
        if (a.legendMatch == b.legendMatch) return true
        else return false

      }),
      titleTemplate: "Double Click or Zoom in to see the individual events."

    },
    // groupEditable: {
    //   order: true
    // },
    // groupOrder: function (a, b) {
    //   return a.value - b.value;
    // },
    // groupOrderSwap: function (a, b, groups) {
    //   var v = a.value;
    //   a.value = b.value;
    //   b.value = v;
    // }
  };

  //subs flag
  periodSubscription: Subscription;

  annotationActive = [];

  itemLabels;
  labelFormat;

  groupsLabels;
  groupsFormat;
  

  startTime;
  endTime;
  assetId
  constructor(
    private dataSync: DataSyncService,
    // private _snackBar: MatSnackBar,
    private timelineServ: TimelineService,
    public dialog: MatDialog,
    private actRoute: ActivatedRoute,

  ) {
    this.assetId = this.actRoute.snapshot.params.id;
    // console.log(this.actRoute.snapshot);

  }

  ngOnInit(): void { }


  async ngOnChanges(changes: SimpleChanges) {
    //console.log(changes);

    if (changes.config && this.config) {

      //this.loading.emit('start')

      //clear data vars if new config
      this.groups = [];
      this.items = [];
      this.finalGroups.clear();
      this.finalItems.clear();


      const promise = new Promise<void>((resolve, reject) => {

        if (this.config.data.data.length > 0 && this.config.start !== "" && this.config.end !== "") {
          // console.log(this.config.data)
          resolve()

        } else if (this.config.data.data.length == 0) reject('no-data')
        else reject('no datetime was provided')

      })

      promise.then(async () => {

        if (this.timeline) {

          //build groups & items for timeline
          if(this.showGroups) this.groups = await this.timelineServ['createGroups_' + this.config.id](this.config, this.groupsFormat);
          this.items = await this.timelineServ['createItems_' + this.config.id](this.config);

            //if data are more than 500 and clustering is enabled from the config -> enable clustering mode else disable.
           if (!this.config.clustering || this.items.length <= 500) this.timelineOptions.cluster = false;
           else this.timelineOptions.cluster = {
             maxItems: 10,
             clusterCriteria: ((a, b) => {
               //console.log(a, b)
               if (a.legendMatch == b.legendMatch && a.type == 'box') return true //check why type==box? #TODO
               else return false
   
             }),
             titleTemplate: "Double Click or Zoom in to see the individual events."
           }
   
           //add items/groups to vis DataSet format vars.
           this.finalItems.add(this.items)
           if(this.showGroups) this.finalGroups.add(this.groups)

          if (this.config.data.action == 'new') {
            //if timeline already exist & new data came from a new backend request -> clear annotations,set new datetimes & apply options.
            //reminder: updating finalItems and finalGroups will automatically update the timeline's data. (vis DataSet's functionality)

            this.removeAnno(); // save annotations and check if any applicable in the new timewindow #TODO
            this.startTime = this.config.start;
            this.endTime = this.config.end;

            let extraSpace = (this.endTime - this.startTime) * 0.1

            this.timelineOptions.start = this.startTime;
            this.timelineOptions.end = this.endTime;
            this.timelineOptions.min = this.startTime - extraSpace;
            this.timelineOptions.max = this.endTime + extraSpace;

            this.timeline.setOptions(this.timelineOptions)

          } else {

            //if the new data are filtered ones -> no need to update the datetimes. (local filters wont affect time window)
            //thus, we dont need to clear annotations as well.
            //updating only the cluster options. (in case less than 500 items remained & vice versa) 
            this.timeline.setOptions({ cluster: this.timelineOptions.cluster });

          }


          setTimeout(() => {
            this.loading.emit('done')
          }, 800);




        } else {


          //get the common labels from preconf view.
          this.itemLabels = this.config.datasetsInfo[0].labels.flatMap(v => Object.keys(v))
          this.groupsLabels = this.config.datasetsInfo[0].groups.flatMap(v => Object.keys(v))

          this.labelFormat = this.itemLabels[0]
          this.groupsFormat = this.groupsLabels[0]
          this.showGroups = this.config.grouping;

          //build groups & items for timeline
          if(this.showGroups) this.groups = await this.timelineServ['createGroups_' + this.config.id](this.config, this.groupsFormat);
          this.items = await this.timelineServ['createItems_' + this.config.id](this.config);


          //if data are more than 500 and clustering is enabled from the config -> enable clustering mode else disable.
          if (!this.config.clustering || this.items.length <= 500) this.timelineOptions.cluster = false;
          else this.timelineOptions.cluster = {
            maxItems: 10,
            clusterCriteria: ((a, b) => {
              //console.log(a, b)
              if (a.legendMatch == b.legendMatch && a.type == 'box') return true //check why type==box? #TODO
              else return false

            }),
            titleTemplate: "Double Click or Zoom in to see the individual events."
          }

          //add items/groups to vis DataSet format vars.
          this.finalItems.add(this.items)
          if(this.showGroups) this.finalGroups.add(this.groups)

          //if timeline doesnt exist (first load of view/dashboard or wgt dragged into view from available wdgts)
          //-> set datetimes & create timeline.
          //-> we set the default datetime values from dashboard/config. In case timeline was dragged into view from available wdgts
          // and there is a zoomed current time-window (from other time-wise synced widgets) -> timeline will sync at subscription to periodSubscription
          this.startTime = this.config.start;
          this.endTime = this.config.end;

          let extraSpace = (this.endTime - this.startTime) * 0.1

          this.timelineOptions.start = this.startTime;
          this.timelineOptions.end = this.endTime;
          this.timelineOptions.min = this.startTime - extraSpace;
          this.timelineOptions.max = this.endTime + extraSpace;

          this.createTimeline();


        }

      }, (error) => {

        console.log(error);
        //this.loading.emit('done')

      })

    }

    
    //resized event from dashboard. set a custom threshold per widget
    if (this.timeline && changes.heightResized && this.heightResized >= 0) {

      //console.log(this.heightResized);
      if (changes.heightResized.currentValue > 350) {

        // -150 is beacuse the height that dashboard reports is reffered to the whole area, including headers,labels etc. Approximately these have 150px height.
        this.timeline.setOptions({ height: `${this.heightResized - 175}px`, cluster: this.timelineOptions.cluster })

      } else {

        this.timeline.setOptions({ height: "200px", cluster: this.timelineOptions.cluster })

      }



    }

  }



  createTimeline() {

    if(typeof(this.heightResized) == 'number'){

      if (this.heightResized > 350) {
        this.timelineOptions.height =  `${this.heightResized - 175}px`
      } else {
        this.timelineOptions.height =  "200px"
      }

    }else this.timelineOptions.height = this.config.height;
    
    if(this.showGroups) this.timeline = new Timeline(this.timelineContainer.nativeElement, this.finalItems, this.finalGroups, this.timelineOptions)
    else this.timeline = new Timeline(this.timelineContainer.nativeElement, this.finalItems, this.timelineOptions)

    //to apper clusters at init (vis bug)
    if (this.timelineOptions.cluster) this.zoomOutMax();

    if (this.config.doubleClick) this.timeline.on("doubleClick", this.doubleClicked.bind(this));

    if (this.config.zoomSync && (!this.periodSubscription || this.periodSubscription.closed)) {

      this.periodSubscription = this.dataSync.currentPeriod.subscribe((incomingZoom) => {
        //console.log(incomingZoom , 'in Timeline')

        setTimeout(() => {

          if ((this.timeline && incomingZoom.length == 3) && (this.startTime !== incomingZoom[0] || this.endTime !== incomingZoom[1])) {

            //console.log('mpike timeline zoom');

            this.startTime = incomingZoom[0]
            this.endTime = incomingZoom[1]

            this.timeline.setWindow(incomingZoom[0], incomingZoom[1])

          }

        }, 200)


      })
    }

    this.timeline.on("rangechanged", this.onRangeChanged.bind(this));


    setTimeout(() => {
      this.loading.emit('done')
    }, 1200);

  }


  doubleClicked(clicked) {

    console.log(clicked)

    if (clicked.what !== 'group-label' && !clicked.isCluster) {
      this.dialog.open(DoubleclickTimelineComponent, {
        data: clicked, maxHeight: 'calc(100vh - 90px)'
      }).afterClosed().subscribe(returned => {

        if (returned) {

          if (clicked.what !== 'custom-time') {

            let clickedTimestamp = new Date(clicked.time).getTime()
            let title = returned[1]

            switch (returned[0]) {
              case 'high':
                this.timeline.addCustomTime(clicked.time, 'highPriority-' + clickedTimestamp)
                this.timeline.setCustomTimeMarker(title, 'highPriority-' + clickedTimestamp, false)
                this.annotationActive.push({ id: 'highPriority-' + clickedTimestamp, title: title });
                break;
              case 'low':
                this.timeline.addCustomTime(clicked.time, 'lowPriority-' + clickedTimestamp)
                this.timeline.setCustomTimeMarker(title, 'lowPriority-' + clickedTimestamp, false)
                this.annotationActive.push({ id: 'lowPriority-' + clickedTimestamp, title: title });
                break;
              case 'medium':
                this.timeline.addCustomTime(clicked.time, 'mediumPriority-' + clickedTimestamp)
                this.timeline.setCustomTimeMarker(returned[1], 'mediumPriority-' + clickedTimestamp, false)
                this.annotationActive.push({ id: 'mediumPriority-' + clickedTimestamp, title: title });
                break;
            }


          } else {

            this.timeline.removeCustomTime(clicked.customTime);
            this.annotationActive = this.annotationActive.filter(annot => annot.id !== clicked.customTime)
          }

        }


      })


    }


  }


  switchLabels() {    
    if (!this.showLabels) this.finalItems.update(this.finalItems.map(obj => ({ ...obj, content: "" })))
    else this.finalItems.update(this.finalItems.map(obj => ({ ...obj, content: obj[this.labelFormat] })))
  }

  async switchGroups() {    
    
   this.finalItems.update(this.finalItems.map(obj => ({ ...obj, group: obj[this.groupsFormat] })))

   this.finalGroups.clear()
   this.groups = [];

   this.groups = await this.timelineServ['createGroups_' + this.config.id](this.config, this.groupsFormat);

   this.finalGroups.add(this.groups);

  }

  async switchGrouping(){
    // this.config.grouping = false;
    if(this.showGroups){
      this.finalItems.update(this.finalItems.map(obj => ({ ...obj, group: obj[this.groupsFormat] })))

      this.finalGroups.clear()
      this.groups = [];
   
      this.groups = await this.timelineServ['createGroups_' + this.config.id](this.config, this.groupsFormat);
   
      this.finalGroups.add(this.groups);
    }
    this.timeline.destroy()
    this.createTimeline()
    // console.log(this.showGroups)
  }


  removeAnno() {
    this.annotationActive.forEach(anno => {

      this.timeline.removeCustomTime(anno.id)

    })
    this.annotationActive = []

  }

  onRangeChanged(period) {

    //console.log(period)
    if (this.startTime !== period.start.getTime() || this.endTime !== period.end.getTime()) {

      //console.log('stelnei to timeline');

      this.startTime = period.start.getTime();
      this.endTime = period.end.getTime();

      if (this.syncFlag) {
        this.dataSync.changePeriod([this.startTime, this.endTime, 'timeline'])
      }

    }

  }


  zoomOutMax() {
    this.timeline.setWindow(this.timelineOptions.start, this.timelineOptions.end)
  }


  move(percentage) {
    const range = this.timeline.getWindow();
    const interval = range.end - range.start;

    this.timeline.setWindow({
      start: range.start.valueOf() - interval * percentage,
      end: range.end.valueOf() - interval * percentage,
    });

  }


  zoomIn() {
    this.timeline.zoomIn(0.2);
  }

  zoomOut() {
    this.timeline.zoomOut(0.2);
  }


  htmlTitle(itemsLength, legendMatch) {

  let color = this.config.datasetsInfo.map(dataset => dataset.legend.find(v => v[legendMatch])).filter(v => v)[0]?.[legendMatch]

    const container = document.createElement("div");
    container.style.backgroundColor = color
    container.style.padding = '0.3em'
    container.innerHTML = itemsLength;
    return container;
  }



  ngOnDestroy() {
    //do NOT destroy timeline here. #BUG

    if (this.periodSubscription) this.periodSubscription.unsubscribe();

    //if(this.config.doubleClick) this.dataSync.changeClicked('none')

  }

}
