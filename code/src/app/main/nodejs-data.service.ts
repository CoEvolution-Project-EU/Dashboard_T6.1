import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NodejsDataService {

  //myhttpHeaders = new HttpHeaders().append('Content-Type', 'application/json').append("Authorization", "Basic " + btoa("admin:Pa55w0rd"));

  constructor(private http_: HttpClient) {
    //console.log(environment.host)
  }

  // public getData(index, ip, start, end) {
  //   // console.log("getCaseervice userId: ", userId);
  //   return this.http_.post(environment.host + '/getData', { 'index': index, 'ip': ip, 'start': start, 'end': end }).toPromise()
  // }

  // public simpleGet(url) {

  //   return this.http_.get(url).toPromise()
  // }

  // public testServ() {

  //   return this.http_.get(environment.host).toPromise()
  // }

  public getPreconfView(asset, preconfid) {

    let url;

    url = 'assets/preconfViews/' + preconfid + '.json'

    return this.http_.get(url).toPromise()
  }



  public getUSB(body) {
    // return this.http_.post(environment.host + '/getUSB', body).toPromise()

    return this.http_.post(
      environment.host + '/getUSB', body
    ).toPromise()
      .catch((error) => {
        const customError = { message: 'An error occurred while fetching data' };
        return customError;
      })
  }

  public getAlerts(body) {
    // return this.http_.post(environment.host + '/getAlerts', body).toPromise()
    return this.http_.post(
      environment.host + '/getAlerts', body
    ).toPromise()
      .catch((error) => {
        const customError = { message: 'An error occurred while fetching data' };
        return customError;
      })
  }

  public getCPUAlerts(body) {
    return this.http_.post(environment.host + '/getCPUAlerts', body).toPromise().catch((error) => {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    })
  }

  public getRAMAlerts(body) {
    return this.http_.post(environment.host + '/getRAMAlerts', body).toPromise().catch((error) => {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    })
  }

  public getMetric(body) {
    return this.http_.post(environment.host + '/getMetric', body).toPromise().catch((error) => {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    })
  }
  public getSecurityDestination(body) {
    return this.http_.post(environment.host + '/getSecurityDestination', body).toPromise().catch((error) => {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    })
  }
  public getProcess(body) {
    return this.http_.post(environment.host + '/getProcess', body).toPromise().catch((error) => {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    })
  }
  public getUncommon(body) {
    return this.http_.post(environment.host + '/getUncommon', body).toPromise().catch((error) => {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    })
  }
  public getLogin(body) {
    return this.http_.post(environment.host + '/getLogin', body).toPromise().catch((error) => {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    })
  }
  public getFileint(body) {
    return this.http_.post(environment.host + '/getFileint', body).toPromise().catch((error) => {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    })
  }

  public getFailedSSH(body) {
    return this.http_.post(environment.host + '/getFailedSSH', body).toPromise().catch((error) => {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    })
  }

  public getDiskIO(body) {
    return this.http_.post(environment.host + '/getDiskIO', body).toPromise().catch((error) => {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    })
  }

  public getNetflows(body) {

    // if(body.id == 'aegis-it-research-server1') body['ip'] = "78.46.102.90"
    // console.log("getCaseervice userId: ", userId);
    return this.http_.post(environment.host + '/getNetflows', body).toPromise()
  }

  public getAssets() {
    return this.http_.get(environment.host + '/getAssets').toPromise().catch((error) => {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    })
  }

  // public getCases() {
  //   return this.http_.get('assets/datasets/murder_details.json').toPromise()
  // }

  // public getCalls() {
  //   return this.http_.get('assets/datasets/murder.json').toPromise()
  // }

  // public getAllPreconfViews() {
  //   return this.http_.get('assets/preconfViews').toPromise()
  // }



}
