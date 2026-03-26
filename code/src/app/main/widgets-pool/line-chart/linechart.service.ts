import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LinechartService {

  constructor() { }

  public createData_lineAp(dataset) {
    let finalData = [];
    //console.log(data);

    dataset[0].aggregations.lineChart.buckets.forEach(bucket => {
      finalData.push({ 'timestamp': bucket.key, 'datapoints': bucket.avgValues.value ? (bucket.avgValues.value).toFixed(1) : 0 })
    });

    return finalData;

  }

  public createData_lineCpu(dataset) {
    let finalData = [];
    //console.log(data);
    // if(dataset[0].lineChart.buckets[0].key > start){
    //   finalData.push({ 'timestamp': start, 'datapoints': 0 })
    // } 

    dataset[0].aggregations.lineChart.buckets.forEach(bucket => {
      finalData.push({ 'timestamp': bucket.key, 'datapoints': bucket.avgValues.value ? (bucket.avgValues.value * 100).toFixed(1) : 0 })
    });

    // if(dataset[0].lineChart.buckets[dataset[0].lineChart.buckets.length - 1].key < end){
    //   finalData.push({ 'timestamp': end, 'datapoints': 0 })

    //} 

    return finalData;

  }

  public createData_lineMemory(dataset) {
    let finalData = [];
    //console.log(data);

    dataset[0].aggregations.lineChart.buckets.forEach(bucket => {
      finalData.push({ 'timestamp': bucket.key, 'datapoints': bucket.avgValues.value ? (bucket.avgValues.value * 100).toFixed(1) : 0 })
    });

    return finalData;

  }

  public createData_lineNetwork(dataset) {
    let finalData = [];
    //console.log(data);

    dataset[0].lineChart.buckets.forEach(bucket => {
      finalData.push({ 'timestamp': bucket.key, 'datapoints': bucket.avgValues.value ? (bucket.avgValues.value).toFixed(1) : 0 })
    });

    return finalData;

  }



  public createData_networkIn(dataset) {
    let finalData = [];

    dataset[0].aggregations.lineChart.buckets.forEach(v => {

      finalData.push({ 'timestamp': v.key, 'datapoints': v.Network_bytes.value })

    });

    return finalData;

  }

  public createData_networkOut(dataset) {
    let finalData = [];

    dataset[0].aggregations.lineChart.buckets.forEach(v => {

      finalData.push({ 'timestamp': v.key, 'datapoints': v.Network_bytes.value })

    });

    return finalData;

  }

}
