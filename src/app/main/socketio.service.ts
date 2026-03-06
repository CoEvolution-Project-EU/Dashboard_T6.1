import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class SocketioService {
  socket;
  private inMessage = new BehaviorSubject(undefined);

  constructor() {

    if (environment.production) this.socket = io(environment.socket_host, { path: '/server/socket.io' });
    else this.socket = io(environment.socket_host);


    this.socket.on('template', (data) => {
      this.inMessage.next(data);
    });


   }

    //open socket + create observable
  liveData = () => {

    this.socket.connect();
    return this.inMessage.asObservable();
  }

   //close socket + clear observable
  disconSocket() {
    this.socket.disconnect();
    //this.socket.off('message')
    this.inMessage.next(undefined)
  }


}
