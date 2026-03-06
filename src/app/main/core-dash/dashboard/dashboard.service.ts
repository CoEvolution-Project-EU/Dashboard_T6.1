import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor() { }


  public filterDataset_alerts(filters, data) {

    let tempData = JSON.parse(JSON.stringify(data))
    let alertTypes = filters.alertType;

    if (alertTypes.length > 0) {

      if (tempData.hits) {

        tempData.hits.hits = tempData.hits.hits.filter(v => alertTypes.some(type => type == v._source['kibana.alert.rule.name']))

      }

    }

    return tempData

  }

  public createLocalFilt_alerts(data) {
    let newOptions = {
      alertType_options: []
    };

    if (data.hits) {

      newOptions.alertType_options = [...new Set(data.hits.hits.map(v => v._source['kibana.alert.rule.name']))]

    }
    return newOptions;

  }

  public createLocalFilt_login(data) {

    let newOptions = {
      userType_options: []
    };

    if (data['loginDetails'].hits) {

      newOptions.userType_options = [...new Set(data['loginDetails'].hits.hits.map(v => v._source.user.name))]

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

    if (data['uncommonDetails'].hits && data['uncommonDetails'].hits.hits) {

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

    if (data['processDetails'].hits) {

      newOptions.userType_options = [...new Set(data['processDetails'].hits.hits.flatMap(v => v.fields['user.name']))]

    }
    newOptions.userType_options = newOptions.userType_options.filter(function (element) {
      return element !== undefined;
    });

    return newOptions;
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
