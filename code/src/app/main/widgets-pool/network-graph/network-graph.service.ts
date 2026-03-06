import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NetworkGraphService {


  constructor() { }

  // public createEdges_mainDashNetflows(dataset){
  //   //console.log(data);

  //   let finalEdges = []


  //   dataset[0].hits.hits.forEach((v,i) => {

  //     let index = finalEdges.findIndex(e => e.from == v._source.source.ip && e.to == v._source.destination.ip );

  //     if(index > -1){

  //       finalEdges[index].dates.push(v.sort[0])
  //       finalEdges[index].value ++;
  //       finalEdges[index].activeIndices.push(Number(finalEdges[index].label))
  //       finalEdges[index].label = String(Number(finalEdges[index].label) + 1);
  //       finalEdges[index].packets.push(v._source.network.packets)
  //       finalEdges[index].bytes.push(v._source.network.bytes)


  //     }else{

  //       finalEdges.push({

  //         from: v._source.source.ip,
  //         to: v._source.destination.ip,
  //         value: 1,
  //         activeIndices:[0],
  //         dates: [v.sort[0]],
  //         packets: [v._source.network.packets],
  //         bytes: [v._source.network.bytes],
  //         label: String(1),
  //         type: 'interraction',
  //         title: ""
  //       })

  //     }

  //   })

  //   // finalEdges.push({

  //   //   from: '10.104.14.32',
  //   //   to: 'GreekServer01',
  //   //   value: 1,
  //   //   label: 'Hosted',
  //   //   type: 'link',
  //   //   font:{
  //   //     align: 'bottom'
  //   //   },
  //   //   dashes:true,
  //   //   // arrows:{
  //   //   //   to:false
  //   //   // }
  //   //   color:{
  //   //     color: "#3e546d"
  //   //   }
  //   // })

  //   // finalEdges.push({

  //   //   from: '10.105.10.40',
  //   //   to: 'ChinaServer09',
  //   //   value: 1,
  //   //   label: 'Hosted',
  //   //   type: 'link',
  //   //   font:{
  //   //     align: 'bottom'
  //   //   },
  //   //   dashes:true,
  //   //   // arrows:{
  //   //   //   to:false
  //   //   // }
  //   //   color:{
  //   //     color: "#3e546d"
  //   //   }
  //   // })

  //   return finalEdges;
    
  // }

  // public createNodes_mainDashNetflows(dataset){
  //   //console.log(data);

  //   let finalNodes = []

    
  //   let uniqueNames = [...new Set(dataset[0].hits.hits.map(v => v._source.source.ip).concat(dataset[0].hits.hits.map(v =>  v._source.destination.ip)))];

  //   uniqueNames.forEach(name => {
  //     finalNodes.push({

  //       id:name,
  //       label:name,
  //       //title: ' - ',
  //       //value: 1
  //       type: 'dynamic',
  //       //shape: name == '10.104.14.32' ?  'diamond' : 'dot',
  //       // color:{
  //       //   background:  name == '10.104.14.32'? '#ff4081' : undefined
  //       // }
  //     })
  //   })

  //   // finalNodes.push({
  //   //   id:'GreekServer01',
  //   //   label: 'GreekServer01',
  //   //   type: 'static',
  //   //   hidden: false,
  //   //   shape: "image",
  //   //   image: 'assets/images/database.png'
  //   // })

  //   // finalNodes.push({
  //   //   id:'ChinaServer09',
  //   //   label: 'ChinaServer09',
  //   //   type: 'static',
  //   //   hidden: false,
  //   //   shape: "image",
  //   //   image: 'assets/images/database.png'
  //   // })
    
  //   return finalNodes;
    
  // }

  public createEdges_murder(config){
    //console.log(dataset);
    let dataset = config.data.data;
    //let extra = data.extra;

    let finalEdges = []

    dataset[0][0].hits.hits.forEach((v,i) => {

      let index = finalEdges.findIndex(e => e.from == v._source.entity1.value && e.to == v._source.entity2.value );

      if(index > -1){

        finalEdges[index].dates.push(v._source.start_timestamp)
        finalEdges[index].value ++;
        finalEdges[index].activeIndices.push(Number(finalEdges[index].label))
        finalEdges[index].label = String(Number(finalEdges[index].label) + 1);
        finalEdges[index].duration.push(v._source.relationship[0].attributes[0].value)
        // finalEdges[index].bytes.push(v._source.network.bytes)


      }else{

        finalEdges.push({

          from: v._source.entity1.value,
          to: v._source.entity2.value,
          value: 1,
          activeIndices:[0],
          dates: [v._source.start_timestamp],
          duration: [v._source.relationship[0].attributes[0].value],
          //bytes: [v._source.network.bytes],
          label: String(1),
          type: 'interraction',
          title: "",
          hidden:false
        })

      }

    })

    return finalEdges;
    
  }

  public createNodes_murder(config){
    //console.log(data);
    let dataset = config.data.data;
    let extra = config.data.extra;
    let selectedEntities = []

    if(extra.length > 0 && extra[0].entities){
      selectedEntities = extra[0].entities;
    }
    let finalNodes = []
    
    let uniqueNames = [...new Set(dataset[0][0].hits.hits.map(v => v._source.entity1.value).concat(dataset[0][0].hits.hits.map(v =>  v._source.entity2.value)))];

    uniqueNames.forEach(name => {

      let ifSelected = selectedEntities.some(s => s == name);

      finalNodes.push({

        id:name,
        label:name,
        hidden:false,
        //title: ' - ',
        //value: 1
        type: 'dynamic',
        //shape: name == '10.104.14.32' ?  'diamond' : 'dot',
        color:{
          // background:  name == '10.104.14.32'? '#ff4081' : undefined
          "border": ifSelected ? config.nodes.filterHighlighted : undefined
        },
        borderWidth: ifSelected ? 3 : 1,

      })
    })

    // finalNodes.push({
    //   id:'GreekServer01',
    //   label: 'GreekServer01',
    //   type: 'static',
    //   hidden: false,
    //   shape: "image",
    //   image: 'assets/images/database.png'
    // })

    // finalNodes.push({
    //   id:'ChinaServer09',
    //   label: 'ChinaServer09',
    //   type: 'static',
    //   hidden: false,
    //   shape: "image",
    //   image: 'assets/images/database.png'
    // })
    
    return finalNodes;
    
  }



}
