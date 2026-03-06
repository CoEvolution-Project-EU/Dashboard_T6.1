import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  casesrights;

  constructor(
    private keycloak: KeycloakService

  ) {

    if (this.keycloak['_userProfile'] && this.keycloak['_userProfile'].attributes.length > 0) this.casesrights = JSON.parse(this.keycloak['_userProfile'].attributes.restrictions)

  }


  // Roxanne functions on read/create/update. [FIX] this for elk-security
  checkReadRights(caseId) {

    if (!this.casesrights[caseId]) return true;
    else {
      if (this.casesrights[caseId].some(x => x == 'read')) return false;
      else return true
    }

  }

  checkCreateRights(caseId) {

    if (!this.casesrights[caseId]) return true;
    else {
      if (this.casesrights[caseId].some(x => x == 'create')) return false;
      else return true
    }
  }

  checkUpdateRights(caseId) {

    if (!this.casesrights[caseId]) return true;
    else {
      if (this.casesrights[caseId].some(x => x == 'update')) return false;
      else return true
    }

  }

  getRights() {
    return this.casesrights
  }

  getToken() {
    return this.keycloak['_instance'].token
  }


}
