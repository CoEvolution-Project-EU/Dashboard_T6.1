import { Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs";


@Injectable({
  providedIn: 'root'
})
export class DataSyncService {

  zoomPeriod: any = [];
  assetID: any = '';

  private nextPeriod = new BehaviorSubject(this.zoomPeriod);
  currentPeriod = this.nextPeriod.asObservable();

  private nextClicked = new BehaviorSubject(this.assetID);
  currentClicked = this.nextClicked.asObservable();

  constructor() { }

  changePeriod(v) {
    this.nextPeriod.next(v)
  }

  changeClicked(v) {
    this.nextClicked.next(v)
  }
}
