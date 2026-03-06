import { Injectable } from '@angular/core';
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import { NodejsDataService } from '../../nodejs-data.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardResolver implements Resolve<any> {

  promises = [];
  constructor(private nodejsService: NodejsDataService) { }
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<any> {

    this.promises = [];
    this.promises.push(this.nodejsService.getPreconfView(route.params.id, route.params.preconfView));

    return Promise.all(this.promises).then((res) => {
      // console.log(res);
      let data = {
        "preconfView": res[0]
      }
      return data;
    }, (error) => {
      return error;
    })


  }
}
