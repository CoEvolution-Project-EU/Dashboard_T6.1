import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// import { HasRolesDirective } from 'keycloak-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [RouterOutlet]
})

export class AppComponent {
  title = 'fvt-core';
  constructor() {
    document.documentElement.setAttribute('data-theme', 'coevolution');
  }
}
