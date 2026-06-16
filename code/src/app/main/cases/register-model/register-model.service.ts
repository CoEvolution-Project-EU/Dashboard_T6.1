// import { Injectable, inject } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable, of } from 'rxjs';
// import { delay } from 'rxjs/operators';
// @Injectable({
//   providedIn: 'root'
// })
// export class RegisterModelService {
//   private http = inject(HttpClient);

//   // βάλε εδώ το πραγματικό endpoint σου
//   private baseUrl = '/api/models';

//   registerModelExp(payload: FormData): Observable<any> {
//     return this.http.post<any>(`${this.baseUrl}/register`, payload);
//   }

  
//   registerModel(payload: FormData): Observable<{ uuid: string }> {
//     console.log('Mock registerModel payload:', {
//       file: payload.get('file'),
//       modelName: payload.get('modelName'),
//       owner: payload.get('owner'),
//       version: payload.get('version'),
//       date: payload.get('date'),
//       description: payload.get('description')
//     });

//     const mockResponse = {
//       uuid: this.generateMockUuid()
//     };

//     return of(mockResponse).pipe(delay(1200));
//   }

//   private generateMockUuid(): string {


//     return '42dc6cad-7fe6-449b-bd3a-88e89781df4a';
//   }


// }