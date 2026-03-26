import { Component, ElementRef, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { DataSyncService } from '../../data-sync.service';
import { Subscription } from 'rxjs';
import { DataSet } from 'vis-data/peer';
import { NetworkGraphService } from './network-graph.service';
import { Network } from 'vis-network/peer';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material Modules
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatLabel } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-network-graph',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatSliderModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatLabel
  ],
  templateUrl: './network-graph.component.html',
  styleUrls: ['./network-graph.component.scss']
})
export class NetworkGraphComponent implements OnInit {

  @Input() config: any;
  @Input() heightResized: any;
  @Input() syncFlag: boolean;

  @ViewChild('network', { static: true }) networkCon: ElementRef;
  @Output() loading = new EventEmitter<any>();

  periodSubscription: Subscription;

  edges = new DataSet([]);
  nodes = new DataSet([]);
  filteredEdges = new DataSet([]);
  filteredNodes = new DataSet([]);
  finalEdges = new DataSet([]);
  finalNodes = new DataSet([]);

  edgesLeft;
  network: any;

  startTime;
  endTime;

  // nodeLabels_selected = 'default'
  // nodeLabels = [];
  edgeWeightOptions_selected = "autocount"
  edgeWeightOptions_adjective = ""
  edgeWeightOptions = [];
  edgeDynamicParams = [];

  toggleOpts = true;
  isPhysics = false;
  hiddenNodes = false;

  //network graph construction options
  sConstant = 0.01;
  sLength = 120;
  cGravity = 0.3;
  gConstant = -20000;

  netResized = {
    height: '500px'
  }

  netOptions: any = {
    layout: {
      //improvedLayout: false,
    },
    height: '500px',
    clickToUse: true,
    nodes: {
      size: 20,
      borderWidth: 1,
      color: {
        border: '#3e546d',
        background: '#219ebc',
        highlight: {
          border: 'black',
          background: '#FF7700'
        },
        hover: {
          border: 'black',
          background: '#FF7700'
        }
      },
      scaling: {
        min: 18,
        max: 40,
        label: {
          enabled: false,
        }
      },
      shape: "dot",
      font: {
        face: "Tahoma",
        color: "#152736",
        size: 22,
        multi: 'html',
        ital: {
          color: '#da5984',
          size: 19
        }
      }
    },
    //groups:{},
    edges: {
      font: {
        strokeWidth: 1.5,
        strokeColor: '#3e536d',
        color: '#3e536d',
      },
      scaling:
      {
        min: 3,
        max: 12,
        label: {
          //enabled:false,
          min: 21,
          max: 25
        }
      },
      arrows: "to",
      color: {
        color: '#ff8f77',
        highlight: '#219ebc',
        hover: '#1A2750'
      },
      smooth: {
        type: "continuous",
      },
    },
    physics: {
      enabled: true,
      barnesHut: {
        gravitationalConstant: this.gConstant,
        centralGravity: this.cGravity,
        springLength: this.sLength,
        springConstant: this.sConstant,
      }
    },
    interaction: {
      hover: true,
      tooltipDelay: 200,
    }
  };

  constructor(
    private dataSync: DataSyncService,
    private netGraphServ: NetworkGraphService
  ) { }

  ngOnInit(): void { }


  async ngOnChanges(changes: SimpleChanges) {
    //console.log(changes);

    if (changes.config && this.config) {

      this.loading.emit('start')

      //clear data vars whenever new data are available
      this.nodes.clear();
      this.edges.clear();
      this.filteredEdges.clear();
      this.filteredNodes.clear();
      this.finalEdges.clear();
      this.finalNodes.clear();


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
        //console.log(this.config.data)
        //create edges,nodes based on new data.
        this.edges.add(this.netGraphServ['createEdges_' + this.config.id](this.config))
        this.nodes.add(this.netGraphServ['createNodes_' + this.config.id](this.config))

        if (this.network) {
          //if network exists and new data request from backend took place, reset hidden nodes, set new datetime window and pass data through Final_ filters to build tooltips etc.
          if (this.config.data.action == 'new') {

            this.hiddenNodes = false;

            this.startTime = this.config.start;
            this.endTime = this.config.end;

          } else {
            //if network exist and new filtered data arrived, keep the user's selection regarding hidden nodes and pass data through Final_ filters to build tooltips etc.
            this.hideStaticNodes();
          }


          //reminder: updating finalEdges and finalNodes will automatically update the network's data. (vis DataSet's functionality)

          this.filteredEdges.add(JSON.parse(JSON.stringify(this.edges.get())))
          this.filteredNodes.add(JSON.parse(JSON.stringify(this.nodes.get())))

          this.finalEdges.update(this.filteredEdges.get({ filter: this.filterEdgesFinal }));
          this.edgesLeft = this.finalEdges.get({ filter: (e) => { return !e.hidden } });
          this.finalNodes.update(this.filteredNodes.get({ filter: this.filterNodesFinal }));


          this.network.stabilize();


        } else {




          //if network doesnt exist (first load of view/dashboard or wgt dragged into view from available wdgts)
          //-> set the edgeWeightOptions, edgeDynamicParams, datetimes, pass data through Final_ filters to build tooltips etc, and create network.
          //-> we set default datetime windows from dashboard/config. In case network wdgt was dragged into view from available wdgts
          //-> and there is a zoomed current time-window (from other time-wise synced wdgts) -> network will sync at subscription to periodSubscription
          this.edgeWeightOptions = this.config.datasetsInfo[0].edgeParams.filter(e => e.weightOption);
          this.edgeDynamicParams = this.config.datasetsInfo[0].edgeParams.filter(e => e.dynamic);

          this.startTime = this.config.start;
          this.endTime = this.config.end;

          this.filteredEdges.add(JSON.parse(JSON.stringify(this.edges.get())))
          this.filteredNodes.add(JSON.parse(JSON.stringify(this.nodes.get())))

          this.finalEdges.update(this.filteredEdges.get({ filter: this.filterEdgesFinal }));
          this.edgesLeft = this.finalEdges.get({ filter: (e) => { return !e.hidden } });
          this.finalNodes.update(this.filteredNodes.get({ filter: this.filterNodesFinal }));

          this.createNetwork();

        }


        setTimeout(() => {
          this.loading.emit('done')
        }, 1200);


      }, (error) => {
        if (error !== 'first') console.log(error);
        //this.loading.emit('done')

      })

    }

    //resized event from dashboard. set a custom threshold per widget
    if (changes.heightResized && this.heightResized >= 0) {

      // -120 is beacuse the height that dashboard reports is reffered to the whole area, including headers,labels etc. Approximately these have 120px height.
      // netResized is the custom style for the options area.
      if (changes.heightResized.currentValue > 300) {

        this.network.setOptions({ height: `${this.heightResized - 120}px` })
        this.netResized = {
          height: `${this.heightResized - 120}px`
        };

      } else {

        this.network.setOptions({ height: "200px" })
        this.netResized = {
          height: "200px"
        };

      }

    }


  }

  createNetwork() {


    this.netOptions.nodes.size = this.config.nodes.size;
    this.netOptions.nodes.borderWidth = this.config.nodes.borderWidth;
    this.netOptions.nodes.color.border = this.config.nodes.color.border;
    this.netOptions.nodes.color.background = this.config.nodes.color.background;
    this.netOptions.nodes.color.highlight = this.config.nodes.color.highlight;
    this.netOptions.nodes.color.hover = this.config.nodes.color.hover;
    this.netOptions.nodes.font.color = this.config.nodes.font.color;
    this.netOptions.nodes.font.size = this.config.nodes.font.size;
    this.netOptions.edges.font = this.config.edges.font;
    this.netOptions.edges.color = this.config.edges.color;


    this.network = new Network(this.networkCon.nativeElement, { nodes: this.finalNodes, edges: this.finalEdges }, this.netOptions);

    if (this.config.hasDates.zoomSync && (!this.periodSubscription || this.periodSubscription.closed)) {

      this.periodSubscription = this.dataSync.currentPeriod.subscribe((incomingZoom) => {
        //console.log(incomingZoom , 'in Network')

        setTimeout(async () => {

          if ((this.network && incomingZoom.length == 3) && (this.startTime !== incomingZoom[0] || this.endTime !== incomingZoom[1])) {

            //console.log('mpike network zoom');
            this.startTime = incomingZoom[0]
            this.endTime = incomingZoom[1]

            this.filteredEdges.clear();
            this.filteredNodes.clear();

            this.filteredEdges.add(JSON.parse(JSON.stringify(this.edges.get())))
            this.filteredNodes.add(JSON.parse(JSON.stringify(this.nodes.get())))
            this.finalEdges.update(this.filteredEdges.get({ filter: this.filterEdgesFinal }));
            this.edgesLeft = this.finalEdges.get({ filter: (e) => { return !e.hidden } });
            this.finalNodes.update(this.filteredNodes.get({ filter: this.filterNodesFinal }));

            //this.network.stabilize();

          }

        }, 200)

      })
    }

    //this.network.on("stabilizationProgress", this.loadStart.bind(this));
    // //after physics setup -> disable them
    this.network.on("stabilizationIterationsDone", this.loadEnd.bind(this));
    // //onn doubleclick add calls to mat table
    // this.network.on("doubleClick", this.doubleClicked.bind(this))



  }


  filterEdgesFinal = (edge) => {
    //let finalEdges = [];


    //edges.forEach(edge => {

    //we have set same type value in edges, reffering to the ones that have dynamic values, datetimes etc. The rest are static ones.
    //not tooltip or filter for the statics so far.
    if (edge.type == 'interraction') {

      //at creation of edges (network service) we set an array "activeIndices" , containing all the indices of the values arrays.
      //-> e.g if an edge between two nodes included 4 interractions, the edge should has arrays with the  "packets", the "dates" + other attributes, with length == 4.
      //-> in the example above, the activeIndices array in edge, would be [0,1,2,3]
      //-> whenever we zoom/change timewindow, we search in each edge, which dates are inside the new timewindow and we update the "activeIndices" array in order to keep the positions.
      //-> This way, the 'activeIndices' will always contain the indices of the edge values that should be displayed.
      //->if the edges have no dates, then the 'activeIndices' array will retain the full-set of indices per edge. (network service)

      if (this.config.hasDates.enabled) {
        let newIndices = [];

        edge.dates.forEach((date, indx) => {

          if (date >= this.startTime && date <= this.endTime) {
            newIndices.push(indx)
            //conver timestamps to medium format for tooltip
            edge.dates[indx] = new Date(edge.dates[indx]).toLocaleDateString(undefined, { minute: 'numeric', second: 'numeric' })
          }
        })
        //*see1
        edge.activeIndices = [...newIndices];

      }

      //console.log(edge.activeIndices,edge)

      //check which are the remaining indices. if none, then the efdge won't be displayed at all.
      if (edge.activeIndices.length > 0) {

        let htmlDivs = [];
        //by default, tooltip will contain all the dynamic values from the config.
        //we use the edgeDynamicParams which has all the params, to dynamically-temporary store the final-filtered data in order to create the tooltip
        //creating a 'tempData' to store the values
        this.edgeDynamicParams.forEach((param) => { param['tempData'] = []; })


        this.edgeDynamicParams.forEach(param => {
          //for each param, we store the values for the active indices of the Arrays that each param has in the edge
          //every array in the edge should have EXACT the same name as the para.value from the config/scenario "edgeParams"
          edge.activeIndices.forEach((indx, i) => {

            //do not show more than 20 rows in tooltip
            if (i <= 20) {

              param['tempData'].push(edge[param.value][indx])

            } else if (i == 21) {
              param['tempData'].push('...')

            }
          })
          //add to tooltip - param values.
          htmlDivs.push(`<div style="margin-right: 1em;"><span> <b> ${param.name} </b> </span> <br> ${param['tempData'].join('<br>')} </div> `);

        })

        //set the tooltop
        edge.title = this.htmlTitle(htmlDivs)

        //build edge value (thickness) + label
        if (this.edgeWeightOptions_selected == 'autocount') {

          edge.value = edge.activeIndices.length;
          edge.label = String(edge.activeIndices.length)

        } else {
          //find the parameter that user has selected (edge weight fromat) and get the current values (stored in tempData above) 
          let paramValues = this.edgeDynamicParams.find(param => param.value == this.edgeWeightOptions_selected)['tempData']
          let paramSum = paramValues.reduce((a, b) => a + b, 0)

          switch (this.edgeWeightOptions_adjective) {
            case 'sum':
              edge.value = paramSum;
              edge.label = String(paramSum)
              break;
            case 'avg':
              let amount = paramSum / edge.activeIndices.length;
              if (Number.isNaN(amount)) {
                edge.value = 0
                edge.label = '0'
              } else {
                edge.value = paramSum / edge.activeIndices.length
                edge.label = parseFloat(String(paramSum / edge.activeIndices.length)).toFixed(2)
              }
              break;
            default:
              this.edgeWeightOptions_adjective = 'sum';
              edge.value = paramSum;
              edge.label = String(paramSum)
              break;
          }

        }

        edge.hidden = false;
        return true

      } else {
        edge.hidden = true;
        return true
      }

    } else {
      edge.hidden = true;
      return true
    }

    //})




    // return finalEdges

  }

  filterNodesFinal = (node) => {



    //we check the remaining edges, in order to hide the nodes that has no edges connected left.
    if (this.edgesLeft.some(v => v.from == node.id || v.to == node.id)) node.hidden = false;
    else node.hidden = true;



    return true
  }



  switchEdgeValues() {

    if (this.edgeWeightOptions_selected == 'autocount') {

      this.finalEdges.update(this.finalEdges.map(obj => obj.type == 'interraction' ? { ...obj, value: obj['activeIndices'].length, label: String(obj['activeIndices'].length) } : obj))

    } else {

      this.finalEdges.forEach(edge => {

        if (edge.type == 'interraction') {

          let paramValues = [];

          //for each edge find the values (active indices only) for the parameter that user has selected (edge weight format) 
          //each parameter's array in edge should have EXACT the same name as the param.value from the config/scenario "edgeParams"
          edge.activeIndices.forEach(indx => {
            paramValues.push(edge[this.edgeWeightOptions_selected][indx])
          })

          let paramSum = paramValues.reduce((a, b) => a + b, 0);

          switch (this.edgeWeightOptions_adjective) {
            case 'sum':
              edge.value = paramSum;
              edge.label = String(paramSum)
              break;
            case 'avg':
              let amount = paramSum / edge.activeIndices.length;
              if (Number.isNaN(amount)) {
                edge.value = 0
                edge.label = '0'
              } else {
                edge.value = paramSum / edge.activeIndices.length
                edge.label = parseFloat(String(paramSum / edge.activeIndices.length)).toFixed(2)
              }
              break;
            default:
              this.edgeWeightOptions_adjective = 'sum';
              edge.value = paramSum;
              edge.label = String(paramSum)
              break;
          }

        }
      })
      console.log('end')
      this.finalEdges.update(this.finalEdges.get())

    }


  }

  hideStaticNodes() {

    this.finalNodes.update(this.finalNodes.map(obj =>
      obj.type == 'static' ? { ...obj, hidden: this.hiddenNodes } : obj
    ))

    this.nodes.forEach(node => { if (node.type == 'static') node.hidden = this.hiddenNodes })

  }


  loadEnd(event) {

    if (this.isPhysics == false) this.network.setOptions({ physics: false })
  }

  setOpts(event) {

    if (event == 'reset') {
      this.sConstant = 0.01;
      this.sLength = 120;
      this.cGravity = 0.3;
      this.gConstant = -10000;
    }

    this.network.setOptions({
      physics: {
        barnesHut: {
          springConstant: this.sConstant,
          springLength: this.sLength,
          centralGravity: this.cGravity,
          gravitationalConstant: this.gConstant
        }
      }
    })

    if (this.isPhysics == false) this.network.stabilize();


  }

  setPhysics(event) {

    if (event == true) this.network.setOptions({ physics: true })
    else this.network.setOptions({ physics: false })

  }

  htmlTitle(html, langs?, tops?) {
    const container = document.createElement("div");
    html.forEach(paramVals => {
      container.insertAdjacentHTML('beforeend', paramVals)
    })
    //container.innerHTML = html;
    //if(langs) container.insertAdjacentHTML('beforeend',langs )
    //if(tops) container.insertAdjacentHTML('beforeend',tops )
    container.className = 'f'

    return container;
  }

  fit() {
    this.network.fit();
  }

  ngOnDestroy() {

    if (this.periodSubscription) this.periodSubscription.unsubscribe();

    // if (this.network !== null) {
    //   this.network.destroy();
    //   this.network = null;
    // }


  }


}
