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

  public async getUSB(path, body): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http_.post(environment.host + path + '/getUSB', body, { headers: this.myhttpHeaders })
      );
      return response;
    } catch (error) {
      // Customize your error handling here
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    }
  }

  public async getAlerts(path, body) {
    try {

      const response = await firstValueFrom(
        this.http_.post(environment.host + path + '/getAlerts', body, { headers: this.myhttpHeaders })
      );
      return response;
    } catch (error) {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    }
  }


  public async getMetrics(path, body) {
    try {
      const response = await firstValueFrom(
        this.http_.post(environment.host + path + '/getMetrics', body, { headers: this.myhttpHeaders })
      );
      return response;
    } catch (error) {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    }
  }

  public async getCommunication(path, body) {
    try {
      const response = await firstValueFrom(
        this.http_.post(environment.host + path + '/getCommunication', body, { headers: this.myhttpHeaders })
      );
      return response;
    } catch (error) {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    }
  }

  public async getProcesses(path, body) {
    try {
      const response = await firstValueFrom(
        this.http_.post(environment.host + path + '/getProcesses', body, { headers: this.myhttpHeaders })
      );
      return response;
    } catch (error) {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    }
  }

  public async getUncommonProcesses(path, body) {
    try {
      const response = await firstValueFrom(
        this.http_.post(environment.host + path + '/getUncommonProcesses', body, { headers: this.myhttpHeaders })
      );
      return response;
    } catch (error) {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    }
  }

  public async getLogins(path, body) {
    try {
      const response = await firstValueFrom(
        this.http_.post(environment.host + path + '/getLogins', body, { headers: this.myhttpHeaders })
      );
      return response;
    } catch (error) {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    }
  }

  public async getFileIntegrity(path, body) {
    try {
      const response = await firstValueFrom(
        this.http_.post(environment.host + path + '/getFileIntegrity', body, { headers: this.myhttpHeaders })
      );
      return response;
    } catch (error) {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    }
  }

  public async getFailedSSH(path, body) {
    try {
      const response = await firstValueFrom(
        this.http_.post(environment.host + path + '/getFailedSSH', body, { headers: this.myhttpHeaders })
      );
      return response;
    } catch (error) {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    }
  }

  public async getDiskIO(path, body) {
    try {
      const response = await firstValueFrom(
        this.http_.post(environment.host + path + '/getDiskIO', body, { headers: this.myhttpHeaders })
      );
      return response;
    } catch (error) {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    }
  }

  public async getNetflows(path, body) {
    try {
      const response = await firstValueFrom(
        this.http_.post(environment.host + path + '/getNetflows', body, { headers: this.myhttpHeaders })
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  public async getNetworkIn(path, body) {
    try {
      const response = await firstValueFrom(
        this.http_.post(environment.host + path + '/getNetworkIn', body, { headers: this.myhttpHeaders })
      );
      return response;
    } catch (error) {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    }
  }

  public async getNetworkOut(path, body) {
    try {
      const response = await firstValueFrom(
        this.http_.post(environment.host + path + '/getNetworkOut', body, { headers: this.myhttpHeaders })
      );
      return response;
    } catch (error) {
      const customError = { message: 'An error occurred while fetching data' };
      return customError;
    }
  }

  public async getOrders(path) {
    try {
      const response = await firstValueFrom(this.http_.get(path));
      return response;
    } catch (error) {
      const customError = { message: 'An error occurred while fetching data', error };
      return customError;
    }
  }
}
