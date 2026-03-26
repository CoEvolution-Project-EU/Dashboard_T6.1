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
  }

  checkCasesRights(caseId) {

    let casesObject = JSON.parse(this.casesrights[0]);
    let cases: string[] = Object.keys(casesObject);

    return caseId.filter(item => cases.includes(item));


  }


  // Roxanne functions on read/create/update. [FIX] this for elk-security
  checkRights(caseId) {

    if (!this.casesrights[caseId]) return true;
    else {
      if (this.casesrights[caseId].some(x => x == 'read')) return false;
      else return true;
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

    if (this.keycloak['_userProfile'] && this.keycloak['_userProfile'].hasOwnProperty('attributes')) {
      this.casesrights = this.keycloak['_userProfile'].attributes
    } else {
      console.log('attributes property does not exist');
    }
    return this.casesrights
  }

  getToken() {
    return this.keycloak['_instance'].token
  }


}
