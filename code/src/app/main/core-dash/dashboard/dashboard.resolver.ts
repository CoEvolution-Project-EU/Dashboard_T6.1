import { Injectable } from '@angular/core';
import { RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { NodejsDataService } from '../../nodejs-data.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardResolver  {

  promises = [];
  constructor(private nodejsService: NodejsDataService) { }
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<any> {

    route.data = { ...route.data, title: route.data?.title || 'Untitled' }; // Ensure title property is set

    this.promises = [];

    this.promises.push(this.nodejsService.getPreconfView(route.params.id, route.params.preconfView));


    return Promise.all(this.promises).then((res) => {
      let data = {
        "preconfView": res[0]
      }
      return data;
    }, (error) => {
      return error;
    })


  }
}
