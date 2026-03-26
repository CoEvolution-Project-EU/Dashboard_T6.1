import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor() { }


  public filterDataset_alerts(filters, data) {

    let tempData = JSON.parse(JSON.stringify(data))

    let alertName = filters.alertName;

    if (alertName.length > 0) {

      if (tempData.hits) {
        // console.log(tempData.hits.hits);

        tempData.hits.hits = tempData.hits.hits.filter(v => alertName.some(type => type == v._source['kibana.alert.rule.name']))

      }

    }
    // console.log(tempData);

    return tempData

  }

  public createLocalFilt_alerts(data) {
    let newOptions = {
      alertName_options: []
    };

    if (data.hits) {
      // console.log(data.hits);
      //*see1
      newOptions.alertName_options = [...new Set(data.hits.hits.map(v => v._source['kibana.alert.rule.name']))]

    }

    return newOptions;

  }

  public createLocalFilt_login(data) {

    let newOptions = {
      userType_options: []
    };

    if (data.hits) {
      //*see1
      newOptions.userType_options = [...new Set(data.hits.hits.map(v => v._source.user.name))]

    }
    return newOptions;
  }

  public filterDataset_login(filters, data) {

    let tempData = JSON.parse(JSON.stringify(data))
    let userTypes = filters.userType;


    if (userTypes.length > 0) {

      if (tempData.hits) {

        tempData.hits.hits = tempData.hits.hits.filter(v => userTypes.some(type => type == v._source.user.name))

      }

    }

    return tempData

  }

  public createLocalFilt_uncommon(data) {

    let newOptions = {
      userType_options: []
    };

    if (data.hits && data.hits.hits) {
      //*see1
      // newOptions.userType_options = [...new Set(data['uncommonDetails'].hits.hits.map(v => v._source.user.name))]

    }
    return newOptions;
  }

  public filterDataset_uncommon(filters, data) {

    let tempData = JSON.parse(JSON.stringify(data))
    let userTypes = filters.userType;


    if (userTypes.length > 0) {

      if (tempData.hits) {

        tempData.hits.hits = tempData.hits.hits.filter(v => userTypes.some(type => type == v._source.user.name))

      }

    }

    return tempData

  }


  public createLocalFilt_process(data) {

    let newOptions = {
      userType_options: []
    };

    if (data.aggregations) {
      //*see1
      // newOptions.userType_options = [...new Set(data['processDetails'].hits.hits.flatMap(v => v.fields['user.name']))]

    }
    // newOptions.userType_options = newOptions.userType_options.filter(function (element) {
    //   return element !== undefined;
    // });

    return newOptions;
  }


  public createLocalFilt_communication(data) {

    let newOptions = {
      userType_options: []
    };

    // if (data.aggregations) {


    // }

    return newOptions;
  }

  public filterDataset_communication(filters, data) {

    let tempData = JSON.parse(JSON.stringify(data))
    // let userTypes = filters.userType;


    // if (userTypes.length > 0) {

    //   if (tempData.hits) {

    //     tempData.hits.hits = tempData.hits.hits.filter(v => userTypes.some(type => type == v.fields['user.name']))

    //   }

    // }

    return tempData

  }

  public createLocalFilt_networkIn(data) {

    let newOptions = {
      userType_options: []
    };

    // if (data.aggregations) {


    // }

    return newOptions;
  }

  public filterDataset_networkIn(filters, data) {

    let tempData = JSON.parse(JSON.stringify(data))
    // let userTypes = filters.userType;


    // if (userTypes.length > 0) {

    //   if (tempData.hits) {

    //     tempData.hits.hits = tempData.hits.hits.filter(v => userTypes.some(type => type == v.fields['user.name']))

    //   }

    // }

    return tempData

  }


  public filterDataset_process(filters, data) {

    let tempData = JSON.parse(JSON.stringify(data))
    let userTypes = filters.userType;


    if (userTypes.length > 0) {

      if (tempData.hits) {

        tempData.hits.hits = tempData.hits.hits.filter(v => userTypes.some(type => type == v.fields['user.name']))

      }

    }

    return tempData

  }

}
