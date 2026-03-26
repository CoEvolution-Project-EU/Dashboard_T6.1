import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material Modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
// **Keycloak
import { AuthDataContextService } from '../../guard/auth-data-context.service';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  params;

  constructor(
    public router: Router,
    private actroute: ActivatedRoute,
    // **Keycloak
    private authContext: AuthDataContextService

  ) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.params = this.actroute.snapshot.url

  }

  ngOnInit(): void {
    //console.log(this.actroute);

  }

  goToRoute(id) {
    this.router.navigate(['assets-overview']);

    // if(id == '') this.router.navigate(['assets-overview']);
    // else this.router.navigate(['assets-overview' , 'dashboards' , id]);

  }

  logout() {
    sessionStorage.removeItem('auth_token');
    this.authContext.logout()
  }
}
