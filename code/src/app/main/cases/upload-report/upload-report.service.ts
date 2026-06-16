import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';



export interface EngineOption {
  id: string;
  name: string;
}

export interface ReportUploadResponse {
  reportId: string;
  fileName: string;
  modelId: string;
  engineId: string;
  engineName?: string;
  reportType: string;
  uploadedAt?: string;
}

@Injectable({
  providedIn: 'root'
})

export class ReportUploadService {
  // βάλε εδώ το πραγματικό endpoint όταν είναι έτοιμο
//   private readonly uploadUrl = '/api/reports/upload';
//   private readonly enginesUrl = '/api/engines';

  constructor(
    // private http: HttpClient
) {}

  getEngines(): Observable<EngineOption[]> {
    // dummy data για τώρα
    return of([
      { id: 'sc', name: 'SC Engine' },
      { id: 'ra', name: 'Risk Analysis Engine' },
      { id: 'qa', name: 'Quality Assessment Engine' }
    ]).pipe(delay(300));

    // αργότερα:
    // return this.http.get<EngineOption[]>(this.enginesUrl);
  }

  uploadReport(payload: {
    engineId: string;
    modelId: string;
    reportType: string;
    notes?: string;
    file: File;
  }): Observable<ReportUploadResponse> {
    const formData = new FormData();
    formData.append('engineId', payload.engineId);
    formData.append('modelId', payload.modelId);
    formData.append('reportType', payload.reportType);
    formData.append('notes', payload.notes ?? '');
    formData.append('file', payload.file);

    // dummy response για τώρα
    return of({
      reportId: `REP-${payload.reportType.toLowerCase().replace(/\s+/g, '_')}-${new Date().toISOString().replace(/[:.]/g, '')}`,
      fileName: payload.file.name,
      modelId: payload.modelId,
      engineId: payload.engineId,
      reportType: payload.reportType,
      uploadedAt: new Date().toISOString()
    }).pipe(delay(1200));

    // αργότερα:
    // return this.http.post<ReportUploadResponse>(this.uploadUrl, formData);
  }
}