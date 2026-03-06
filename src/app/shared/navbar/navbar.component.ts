import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
// import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  params;

  constructor(
    public router: Router,
    private actroute: ActivatedRoute,
    // private keycloak: KeycloakService
  ) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.params = this.actroute.snapshot.url

  }

  ngOnInit(): void {

  }

  goToRoute(id) {
    this.router.navigate(['assets-overview']);
  }

  logout() {
    // this.keycloak.logout()
  }
}
