import { Injectable } from '@angular/core';
import { NodejsDataService } from '../../nodejs-data.service';

@Injectable({
  providedIn: 'root'
})

export class CasesOverviewService {

  constructor(private nodejs: NodejsDataService) {}


  public async getAssets(token, path, body) {
    try {

      let result = await this.nodejs.getAssets(token, path, body)
      //do w/e here to make a valid format for assets-overview
      //and return to .ts

      let assets = [...new Set(result['assets'])] //*see1
      return assets

    } catch (error) {

      return ['http-error']
    }

  }


}



