import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';


@Component({
  selector: 'app-inspect-dialog',
  templateUrl: './inspect-dialog.component.html',
  styleUrls: ['./inspect-dialog.component.scss']
})
export class InspectDialogComponent implements OnInit {

  chosenID;
  zoomedPeriod;
  period;
  selectedView = 'alertsview';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    public router: Router,
    public _dialogRef: MatDialogRef<InspectDialogComponent>
  ) { 
    //this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    //console.log(data);
    this.chosenID = data.selected
    this.period = data.period
    this.zoomedPeriod = data.zoomedPeriod
  }

  ngOnInit(): void {
  }

  close() {
    this._dialogRef.close()
  }

  proceed(zoomedChecked) {


    if(zoomedChecked){
            
       this.router.navigate(['assets-overview', 'assets-list', 'dashboards', 'core-dash' , this.chosenID, this.selectedView], {queryParams: {sp: this.zoomedPeriod[0] , ep: this.zoomedPeriod[1]}});

    }else{

      this.router.navigate(['assets-overview', 'assets-list', 'dashboards', 'core-dash' , this.chosenID, this.selectedView], {queryParams: {sp: this.period[0] , ep: this.period[1]}});


      }


      this._dialogRef.close(this.selectedView)

      
    // this.router.navigate(['assets-overview', 'assets-list', 'dashboards', 'core-dash' , this.chosenID, this.selectedView], {queryParams: {sp: 1 , ep: 2}});
    // this._dialogRef.close(this.selectedView)

  }


  selected(id) {
    this.selectedView = id
  }


}
