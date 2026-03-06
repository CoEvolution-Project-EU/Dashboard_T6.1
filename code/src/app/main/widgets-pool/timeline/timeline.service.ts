import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimelineService {

  itemsLeft = [];

  constructor() { }

  //-----------MAIN DASH--------------------------

  public createGroups_mainDashAlerts(data, groups?) {
    //console.log(data)

    let finalGroups = [];

    finalGroups.push({
      id: 'events',
      content: 'Alerts'
    })


    return finalGroups;
  }

  public createItems_mainDashAlerts(data) {
    //console.log(data);

    let finalItems = [];

    if (data[0].hits) {

      data[0].hits.hits.forEach((v, i) => {

        finalItems.push({
          id: v._id,
          content: v._source.signal.rule.name,
          default: v._source.signal.rule.name,
          start: new Date(v.sort[0]),
          end: new Date(v.sort[0]),
          //group: 'events',
          title: this.htmlTitle('<span><b>Full Title:</b> ' + v._source.signal.rule.name + '</span><span><b>Message:</b> ' + v._source.signal.reason + '</span>', 'timelineTitles'),
          className: v._source.signal.rule.severity,
          type: 'box'
        })

      })

    } else {

      // console.log(data[0].aggregations.clusters);


      let interval = data[0].aggregations.clusters.buckets[1].key - data[0].aggregations.clusters.buckets[0].key;


      data[0].aggregations.clusters.buckets.forEach(v => {

        if (v.doc_count > 0) {
          let iclass;
          let sevs = v.severities.buckets.map(s => s.key)
          if (sevs.some(sev => sev == 'critical')) iclass = 'critical'
          else if (sevs.some(sev => sev == 'high')) iclass = 'high'
          else if (sevs.some(sev => sev == 'medium')) iclass = 'medium'
          else iclass = 'low'


          finalItems.push({
            //id: v._id,
            content: this.htmlTitle('<span>' + v.doc_count + ' Alerts</span><span>' + iclass + ' (Highest Severity)</span>', 'contentBucket'),
            default: this.htmlTitle('<span>' + v.doc_count + ' Alerts</span><span>' + iclass + ' (Highest Severity)</span>', 'contentBucket'),
            start: new Date(v.key),
            end: new Date(v.key + interval),
            //title: "",
            className: iclass,
            //type: 'background'
          })

        }
      })

    }


    return finalItems;

  }

  //-----------*END OF MAIN DASH--------------------------

  //-----------EVENTS ANALYSIS--------------------------

  // public createGroups_eventsAnal_default(data, groups?) {
  //   //console.log(data)

  //   let finalGroups = [];

  //     finalGroups.push({
  //       id: 'events',
  //       content: 'Alerts'
  //     })


  //   return finalGroups;
  // }

  public createItems_elasticAlerts(data, datasetsInfo) {
    let finalItems = [];
    let legendMatch;

    data.data.data.forEach(dat => {

      if (dat.hits && dat.hits.hits.length > 0) {

        dat.hits.hits.forEach((v, i) => {

          //first argument in this function should contain the legend option that matches for each item (from preconf) - EXACT THE SAME WORD/PHRASE as it's displayed in preconf
          //in this example "v._source.signal.rule.severity" matches exactly with the legend options, so we dont need to modify it, while in the later examples we need to modify the input.
          // let color = this.findColorByLegend(v._source['kibana.alert.rule.severity'], datasetsInfo)
          // console.log(datasetsInfo);

          let color = '#ff8f77';
          let host = '-'
          if (v._source.host && v._source.host.name) host = v._source.host.name



          finalItems.push({
            id: v._id + Math.random() * 1000,
            content: v._source['kibana.alert.rule.name'],
            default: v._source['kibana.alert.rule.name'],
            start: new Date(v.sort[0]),
            end: new Date(v.sort[0]),
            title: this.htmlTitle('<span><b>Full Title:</b> ' + v._source['kibana.alert.rule.name'] + '</span><span><b>Hostname:</b> ' + host + '</span><span><b>Severity:</b> ' + v._source['kibana.alert.rule.severity'] + '</span><span><b>Message:</b> ' + v._source['kibana.alert.reason'] + '</span>', 'timelineTitles'),
            //moreover, here we also add the legendMatch, so we can get this info and use it for filtering/clustering criteria etc later on.
            severity: v._source['kibana.alert.rule.severity'],
            rule_name: v._source['kibana.alert.rule.name'],
            legendMatch: v._source['kibana.alert.rule.severity'],
            hostname: host,
            type: 'box',
            style: "background-color:" + color + "; border-color:" + color + ";",
            group: v._source['kibana.alert.rule.name']
          })

        })
      }
      if (dat.hits && dat.hits.hits.length > 0 && dat.hits.hits[0]['_index'].includes('fvt-ml-cpu-spike-detection')) {

        dat.hits.hits.forEach((v, i) => {

          if (v._source.spike == 1) legendMatch = 'spike 1'
          else legendMatch = 'spike 0'

          let color = this.findColorByLegend(legendMatch, datasetsInfo)

          finalItems.push({
            id: v._id + Math.random() * 1000,
            content: 'Abnormal CPU Load',
            default: 'Abnormal CPU Load',
            start: new Date(v._source['timestamp_id']).getTime(),
            end: new Date(v._source['timestamp_id']).getTime(),
            title: this.htmlTitle('<span><b>Full Title:</b> ' + 'Abnormal CPU Load' + '</span><span><b>Hostname:</b> ' + v._source.target_id + '<br><b>Spike: </b>' + v._source.spike + '<br><b>Detected Timestamp: </b> ' + new Date(v._source['timestamp_id']).toLocaleString() + '</span>', 'timelineTitles'),
            legendMatch: legendMatch,
            hostname: v._source.target_id,
            type: 'box',
            style: "background-color:" + color + "; border-color:" + color + ";"

          })
        })
      }
      if (dat.hits && dat.hits.hits.length > 0 && dat.hits.hits[0]['_index'].includes('fvt-ml-ram-abnormal-detection')) {

        dat.hits.hits.forEach((v, i) => {

          let color = this.findColorByLegend('ml ram', datasetsInfo)

          finalItems.push({
            id: v._id + Math.random() * 1000,
            content: 'Abnormal RAM consumption',
            default: 'Abnormal RAM consumption',
            start: new Date(v._source['timestamp_id']).getTime(),
            end: new Date(v._source['timestamp_id']).getTime(),
            title: this.htmlTitle('<span><b>Full Title:</b> ' + 'Abnormal RAM consumption' + '</span><span><b>Hostname:</b> ' + v._source.target_id + '<br><b>Detected Timestamp: </b> ' + new Date(v._source['timestamp_id']).toLocaleString() + '</span>', 'timelineTitles'),
            legendMatch: 'ml ram',
            hostname: v._source.target_id,
            mean: v._source.mean,
            memory_usage: v._source.memory_usage,
            spike: v._source.spike,
            stdev: v._source.stdev,
            type: 'box',
            style: "background-color:" + color + "; border-color:" + color + ";"

          })
        })
      }
      if (!dat.hits && dat.aggregations) {
        let interval = data[0].aggregations.clusters.buckets[1].key - data[0].aggregations.clusters.buckets[0].key;

        data[0].aggregations.clusters.buckets.forEach(v => {

          if (v.doc_count > 0) {
            let iclass;
            let sevs = v.severities.buckets.map(s => s.key)
            if (sevs.some(sev => sev == 'critical')) iclass = 'critical'
            else if (sevs.some(sev => sev == 'high')) iclass = 'high'
            else if (sevs.some(sev => sev == 'medium')) iclass = 'medium'
            else iclass = 'low'

            finalItems.push({
              content: this.htmlTitle('<span>' + v.doc_count + ' Alerts</span><span>' + iclass + ' (Highest Severity)</span>', 'contentBucket'),
              default: this.htmlTitle('<span>' + v.doc_count + ' Alerts</span><span>' + iclass + ' (Highest Severity)</span>', 'contentBucket'),
              start: new Date(v.key),
              end: new Date(v.key + interval),
              legendMatch: iclass,
            })

          }
        })
      }


    });

    return finalItems;

  }

  public createGroups_elasticAlerts(config, group) {
    let data = config.data.data;
    let finalGroups = [];
    let unique = []
    let extra = config.data.extra;
    let selectedEntities = []


    if (extra.length > 0 && extra[0].entities) {
      selectedEntities = extra[0].entities;
    }

    unique = [...new Set(data[0].hits.hits.map(v => v._source['kibana.alert.rule.name']))]

    unique.forEach(v => {

      let ifSelected = selectedEntities.some(s => s == v);

      finalGroups.push({
        id: v,
        content: v,
        className: ifSelected ? "chosen" : "normal"
      })

    })


    return finalGroups;


  }

  // public createGroups_murder(config, group) {
  //   // console.log(alldata)
  //   let data = config.data.data;
  //   let finalGroups = [];
  //   let unique = []
  //   let extra = config.data.extra;
  //   let selectedEntities = []


  //   if (extra.length > 0 && extra[0].entities) {
  //     selectedEntities = extra[0].entities;
  //   }

  //   if (group == 'callers') unique = [...new Set(data[0][0].hits.hits.map(v => v._source.entity1.value))]
  //   else unique = [...new Set(data[0][0].hits.hits.map(v => v._source.entity2.value))]

  //   unique.forEach(v => {

  //     let ifSelected = selectedEntities.some(s => s == v);

  //     finalGroups.push({
  //       id: v,
  //       content: v,
  //       // style: ifSelected? "background-color:red" : "color:initial",
  //       className: ifSelected ? "chosen" : "normal"
  //     })

  //   })

  //   return finalGroups;
  // }

  // public createItems_murder(config) {

  //   let data = config.data.data
  //   let finalItems = [];

  //   let extra = config.data.extra;
  //   let selectedEntities = []


  //   if(extra.length > 0 && extra[0].entities){
  //     selectedEntities = extra[0].entities;
  //   }
  //   // console.log(data);
  //   //let legendMatch;

  // // console.log(data);

  //   data[0][0].hits.hits.forEach((v, i) => {

  //       //first argument in this fucntion should contain the legend option that matches for each item (from preconf) - EXACT THE SAME WORD/PHRASE as it's displayed in preconf
  //       //in this example "v._source.signal.rule.severity" matches exactly with the legend options, so we dont need to modify it, while in the later examples we need to modify the input.
  //       let color = this.findColorByLegend("calls",config.datasetsInfo)
  //       let duration;

  //       if(v._source.relationship[0].attributes[0].label == 'Duration (sec)') duration = v._source.relationship[0].attributes[0].value

  //       let ifSelected = selectedEntities.some(s => s == v._source.entity2.value);


  //         finalItems.push({
  //           id: v._id + Math.random() * 1000,
  //           content: v._source.entity2.value,
  //           callees: v._source.entity2.value,
  //           callers: v._source.entity1.value,
  //           ['callers -> callees']: v._source.entity1.value + ' -> ' + v._source.entity2.value,
  //           start: new Date(v._source.start_timestamp),
  //           end: new Date(v._source.start_timestamp),
  //           group: v._source.entity1.value,
  //           duration: String(duration),
  //           title: this.htmlTitle('<span><b>Caller:</b> ' + v._source.entity1.value + '</span><span><b>Callee:</b> ' + v._source.entity2.value + '</span><span><b>Duration(sec): </b> ' + duration + '</span>', 'timelineTitles'),
  //           //moreover, here we also add the legendMatch, so we can get this info and use it for filtering/clustering criteria etc later on.
  //           // legendMatch: v._source.signal.rule.severity,
  //           // hostname: v._source.host.name,
  //           type: 'box',
  //           style: "background-color:" + color + ";",
  //           className: ifSelected? "chosen" : "normal"
  //         })

  //   })


  //   //   if (dat.hits && dat.hits.hits.length > 0 && dat.hits.hits[0]['_index'].includes('fvt-ml-cpu-spike-detection')) {

  //       dat.hits.hits.forEach((v, i) => {

  //         if (v._source.spike == 1) legendMatch = 'spike 1'
  //         else legendMatch = 'spike 0'

  //         let color = this.findColorByLegend(legendMatch,datasetsInfo)

  //         finalItems.push({
  //           id: v._id + Math.random() * 1000,
  //           content: 'Abnormal CPU Load',
  //           default: 'Abnormal CPU Load',
  //           start: new Date(v._source['timestamp_id']).getTime(),
  //           end: new Date(v._source['timestamp_id']).getTime(),
  //           title: this.htmlTitle('<span><b>Full Title:</b> ' + 'Abnormal CPU Load' + '</span><span><b>Hostname:</b> ' + v._source.target_id + '<br><b>Spike: </b>' + v._source.spike + '<br><b>Detected Timestamp: </b> ' + new Date(v._source['timestamp_id']).toLocaleString() + '</span>', 'timelineTitles'),
  //           legendMatch: legendMatch,
  //           hostname: v._source.target_id,
  //           type: 'box',
  //           style:"background-color:" + color + "; border-color:" + color + ";"

  //         })
  //       })
  //     }
  //     if (dat.hits && dat.hits.hits.length > 0 && dat.hits.hits[0]['_index'].includes('fvt-ml-ram-abnormal-detection')) {

  //       dat.hits.hits.forEach((v, i) => {

  //         let color = this.findColorByLegend('ml ram',datasetsInfo)

  //         finalItems.push({
  //           id: v._id + Math.random() * 1000,
  //           content: 'Abnormal RAM consumption',
  //           default: 'Abnormal RAM consumption',
  //           start: new Date(v._source['timestamp_id']).getTime(),
  //       end: new Date(v._source['timestamp_id']).getTime(),
  //       title: this.htmlTitle('<span><b>Full Title:</b> ' + 'Abnormal RAM consumption' + '</span><span><b>Hostname:</b> ' + v._source.target_id + '<br><b>Detected Timestamp: </b> ' + new Date(v._source['timestamp_id']).toLocaleString() + '</span>', 'timelineTitles'),
  //       legendMatch: 'ml ram',
  //       hostname: v._source.target_id,
  //       mean: v._source.mean,
  //       memory_usage: v._source.memory_usage,
  //       spike: v._source.spike,
  //       stdev: v._source.stdev,
  //       type: 'box',
  //       style:"background-color:" + color + "; border-color:" + color + ";"

  //     })
  //   })
  // }
  // if (!dat.hits && dat.aggregations) {
  //   let interval = data[0].aggregations.clusters.buckets[1].key - data[0].aggregations.clusters.buckets[0].key;

  //   data[0].aggregations.clusters.buckets.forEach(v => {

  //         if (v.doc_count > 0) {
  //           let iclass;
  //           let sevs = v.severities.buckets.map(s => s.key)
  //           if (sevs.some(sev => sev == 'critical')) iclass = 'critical'
  //           else if (sevs.some(sev => sev == 'high')) iclass = 'high'
  //           else if (sevs.some(sev => sev == 'medium')) iclass = 'medium'
  //           else iclass = 'low'

  //           finalItems.push({
  //             content: this.htmlTitle('<span>' + v.doc_count + ' Alerts</span><span>' + iclass + ' (Highest Severity)</span>', 'contentBucket'),
  //             default: this.htmlTitle('<span>' + v.doc_count + ' Alerts</span><span>' + iclass + ' (Highest Severity)</span>', 'contentBucket'),
  //             start: new Date(v.key),
  //             end: new Date(v.key + interval),
  //             legendMatch: iclass,
  //           })

  //         }
  //       })
  //     }


  //   });

  //   return finalItems;

  // }


  //-----------*END OF EVENTS ANALYSIS--------------------------

  findColorByLegend(legendMatch, datasetsInfo) {
    console.log(datasetsInfo);

    legendMatch = legendMatch.toLowerCase()

    return datasetsInfo.map(dataset => dataset.legend.find(v => v[legendMatch])).filter(v => v)[0]?.[legendMatch]
  }

  htmlTitle(html, myClass) {
    const container = document.createElement("div");
    container.className = myClass
    container.innerHTML = html;
    return container;
  }

}
