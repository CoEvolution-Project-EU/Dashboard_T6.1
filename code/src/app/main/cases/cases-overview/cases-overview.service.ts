import { Injectable } from '@angular/core';
import { NodejsDataService } from '../../nodejs-data.service';

@Injectable({
  providedIn: 'root'
})

export class CasesOverviewService {

  constructor(private nodejs: NodejsDataService) {

  }


  public async getAssets() {

    try {
      let result = await this.nodejs.getAssets()
      //do w/e here to make a valid format for assets-overview
      //and return to .ts

      let assets = [...new Set(result['aggregations'].hostname.buckets.map(v => v.key))]
      return assets

    } catch (error) {

      return ['http-error']
    }

  }


}



