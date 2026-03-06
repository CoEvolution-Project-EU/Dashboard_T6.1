import { Component } from '@angular/core';
// import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'fvt-core';
  constructor() {
    document.documentElement.setAttribute('data-theme', '');
  }
}
