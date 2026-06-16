import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { firstValueFrom } from 'rxjs';
// import { AuthGuardData } from 'keycloak-angular';
import { AuthDataContextService } from '../guard/auth-data-context.service';
// **Keycloak
// import { KeycloakService } from 'keycloak-angular';
@Injectable({
  providedIn: 'root'
})
export class NodejsDataService {

  myhttpHeaders;
   private API = environment.apiUrl;

   constructor(private http_: HttpClient,
    // **Keycloak
    private authContext: AuthDataContextService

  ) {
  }
  public async getToken(): Promise<string> {

    try {
      const token = await this.authContext.token;

      this.myhttpHeaders = new HttpHeaders()
        .append('Content-Type', 'application/json; charset=utf-8')
        .append("Authorization", "Bearer " + this.authContext.token)

      return token;
    }
    catch (error) {
      console.error('Error fetching authentication token:', error);
      throw error;
    }
  }

  // // * TB Discarded
  // public async getToken1(): Promise<string> {
  //   try {
  //     // Check if we have a token in session storage
  //     const storedToken = sessionStorage.getItem('auth_token');

  //     if (storedToken) {
  //       // Use the stored token
  //       this.myhttpHeaders = new HttpHeaders()
  //         .append('Content-Type', 'application/json; charset=utf-8')
  //         .append("Authorization", "Bearer " + storedToken);
  //       return storedToken;
  //     } else {
  //       // Get a new token from the authentication service
  //       const token = await this.authContext.token;

  //       // Store the token in session storage for persistence
  //       sessionStorage.setItem('auth_token', token);

  //       this.myhttpHeaders = new HttpHeaders()
  //         .append('Content-Type', 'application/json; charset=utf-8')
  //         .append("Authorization", "Bearer " + token);
  //       return token;
  //     }
  //   } catch (error) {
  //     console.error('Error fetching authentication token:', error);
  //     throw error;
  //   }
  // }

  // **Keycloak
  public getKeycloakId() {

    let id = this.authContext.userId
    return id;
    // return this.keycloak['_userProfile'].attributes.elastic_id[0]
  }

  public async getAssets(token, path, body) {
    try {
      // console.log('body', this.myhttpHeaders, body);
      await this.getToken();

      const response = await firstValueFrom(this.http_.post(
        environment.host + path + '/getAssets',
        // 'http://178.63.86.245:8989' + path + '/getAssets',

        body,
        { headers: this.myhttpHeaders }
      ));
      return response;
    } catch (error) {
      // Handle error and create a custom error response
      const customError = { message: error };
      return customError;
    }
  }

  public async getPreconfView(asset, preconfid): Promise<any> {
    const url = 'assets/preconfViews/' + preconfid + '.json';
    try {
      const response = await firstValueFrom(this.http_.get(url));
      return response;
    } catch (error) {
      // Handle or propagate the error as needed
      throw error;
    }
  }


  // COEVOLUTION //

  register(name: string, type: string, version: string, description: string, token: string) {
    return this.http_.post(`${this.API}/models/register`,
      { name, type, versioning: [{ version, description }] },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

   uploadRequirements(uuid: string, version: string, file: File, token: string) {
  
    const formData = new FormData();
    formData.append('file', file);
    return this.http_.post(
      `${this.API}/models/${uuid}/versions/${version}/requirements`,
      formData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  getAll(token: string) {
    return this.http_.get(`${this.API}/models`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }


}
