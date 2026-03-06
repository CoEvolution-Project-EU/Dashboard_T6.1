import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DistributionService {

  constructor() { }


  public createData_default(dataset, start, end) {

    let finalData, data = [], timestamps = []

    // let dataram = [];
    // let dataal = [];
    // let datacpu = [];
    // let datatotal = [];

    // dataset.forEach(data => {

    //   if (data.hits && data.hits.hits.length > 0 && data.hits.hits[0]['_index'].includes('fvt-ml-cpu-spike-detection') && data.aggregations) {
    //     datacpu = data.aggregations.distribution.buckets
    //   }
    //   if (data.hits && data.hits.hits.length > 0 && data.hits.hits[0]['_index'].includes('fvt-ml-ram-abnormal-detection') && data.aggregations) {
    //     dataram = data.aggregations.distribution.buckets
    //   }
    //   if (data.hits && data.hits.hits.length > 0 && data.hits.hits[0]['_index'].includes('.siem-signals-default') && data.aggregations) {
    //     dataal = data.aggregations.distribution.buckets
    //   }
    //   if (!data.hits && data.aggregations) {
    //     dataal = data.aggregations.distribution.buckets
    //   }

    // });

    //datatotal = datatotal.concat(datacpu, dataram, dataal)
    // datatotal.sort((a, b) => {
    //   return (new Date(a['key']).getTime() - new Date(b['key']).getTime())
    // })



    if (dataset.aggregations?.distribution) {

      if (dataset.aggregations.distribution.buckets.length > 0 && dataset.aggregations.distribution.buckets[0].key > start) {
        timestamps.push(start)
      }

      dataset.aggregations.distribution.buckets.forEach(bucket => {
        timestamps.push(bucket.key)
        data.push(bucket.doc_count)
      });

      if (dataset.aggregations.distribution.buckets.length > 0 && dataset.aggregations.distribution.buckets[dataset.aggregations.distribution.buckets.length - 1].key < end) {
        timestamps.push(end)
      }

    }

    finalData = { "timestamps": timestamps, "data": data }

    return finalData;

  }

  // public createData_murder(dataset, start, end) {
  //   //console.log(dataset)
  //   let finalData, data = [], timestamps = []
  //    //console.log(dataset);
  //   // let dataram = [];
  //   // let dataal = [];
  //   // let datacpu = [];
  //   // let datatotal = [];

  //   // dataset.forEach(data => {

  //   //   if (data.hits && data.hits.hits.length > 0 && data.hits.hits[0]['_index'].includes('fvt-ml-cpu-spike-detection') && data.aggregations) {
  //   //     datacpu = data.aggregations.distribution.buckets
  //   //   }
  //   //   if (data.hits && data.hits.hits.length > 0 && data.hits.hits[0]['_index'].includes('fvt-ml-ram-abnormal-detection') && data.aggregations) {
  //   //     dataram = data.aggregations.distribution.buckets
  //   //   }
  //   //   if (data.hits && data.hits.hits.length > 0 && data.hits.hits[0]['_index'].includes('.siem-signals-default') && data.aggregations) {
  //   //     dataal = data.aggregations.distribution.buckets
  //   //   }
  //   //   if (!data.hits && data.aggregations) {
  //   //     dataal = data.aggregations.distribution.buckets
  //   //   }

  //   // });

  //   //datatotal = datatotal.concat(datacpu, dataram, dataal)
  //   // datatotal.sort((a, b) => {
  //   //   return (new Date(a['key']).getTime() - new Date(b['key']).getTime())
  //   // })




  //     if (dataset[2][0].key > start) {
  //       timestamps.push(start)
  //     }

  //       dataset[2].forEach(bucket => {
  //         timestamps.push(bucket.key)
  //         data.push(bucket.doc_count)
  //       });

  //     if (dataset[2][dataset[2].length - 1].key < end) {
  //       timestamps.push(end)
  //     }



  //   // if (dataset[0] && dataset[0].aggregations) {


  //   // }


  //   finalData = { "timestamps": timestamps, "data": data }

  //   return finalData;

  // }

}
