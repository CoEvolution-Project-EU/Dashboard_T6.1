import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface RegisterModelPayload {
  name: string;
  type: string;
  input_modality?: string[];
  architecture_family?: string;
  framework?: string;
  model_paradigm?: string;
  questionnaire?: Record<string, unknown>;
  versioning: { version: string; description: string }[];
}

/** Caller-facing input for model registration. */
export interface RegisterModelInput {
  name: string;
  type: string;                  // resolved type (custom value when "Other")
  version: string;
  description: string;
  inputModality?: string[];
  architectureFamily?: string;
  framework?: string;
  modelParadigm?: string;
  questionnaire?: Record<string, unknown>;
}

export interface RegisterModelResponse {
  model: {
    model_uuid: string;
    name: string;
    type: string;
    owner: string;
    versioning: { version: string; description: string }[];
  };
}

export interface ModelVersion {
  version: string;
  description?: string;
  trusted?: boolean;
  requirements_file?: string;
  requirements_url?: string;
  attacks?: string[];
  defences?: string[];
  /** MinIO file IDs for the trusted-model artefacts attached to this version. */
  trusted_model?: string[];
  /** Other resource arrays — included so they can be displayed if needed. */
  assessments?: string[];
  risk_assessment_reports?: string[];
  gadgets_reports?: string[];
  aimodelinfo_reports?: string[];
  euaiact_reports?: string[];
  datasets_reports?: string[];
  ai_mbom?: string[];
  user_assessments?: string[];
  user_defences?: string[];
  requirements?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisteredModel {
  _id?: string;
  model_uuid: string;
  name: string;
  owner: string;
  type: string;
  model_paradigm?: string;
  architecture_family?: string;
  framework?: string;
  input_modality?: string[];
  versioning: ModelVersion[];
}

export interface ModelListResponse {
  count: number;
  models: RegisteredModel[];
}

export interface ModelDetailsResponse {
  model: RegisteredModel;
}

/** Report categories — used as the `type` query value on the reports endpoint. */
export type ReportType =
  | 'risk'
  | 'assessment'
  | 'defence'
  | 'gadgets'
  | 'aimodelinfo'
  | 'euaiact'
  | 'datasets'
  | 'aimbom';

/** All report types shown in the Model Monitoring reports panel. */
export const REPORT_TYPES: ReportType[] = [
  'risk', 'assessment', 'defence', 'gadgets', 'aimodelinfo', 'euaiact', 'datasets', 'aimbom'
];

/** MinIO buckets per report type, per swagger examples. */
export const REPORT_BUCKET_BY_TYPE: Record<ReportType, string> = {
  risk: 'risk-reports',
  assessment: 'assessment-reports',
  defence: 'defence-reports',
  gadgets: 'gadgets-reports',
  aimodelinfo: 'aimodelinfo-reports',
  euaiact: 'euaiact-reports',
  datasets: 'datasets-reports',
  aimbom: 'ai-mbom'
};

/** Pool used for report buckets. */
export const REPORTS_POOL = 'RP';

/** Pool + bucket used for trusted data uploads (Data Upload / Data screens). */
export const TRUSTED_DATA_POOL = 'TRP';
export const TRUSTED_DATA_BUCKET = 'trusted-data';

/** Pool + bucket used for trusted-model uploads (Upload Trusted Model dialog). */
export const TRUSTED_MODELS_POOL = 'TRP';
export const TRUSTED_MODELS_BUCKET = 'trusted-models';

/** Pool + bucket where generated AIMBOMs are stored (AIMBOM screen). */
export const AIMBOM_POOL = 'SAP';
export const AIMBOM_BUCKET = 'ai-mbom';

export interface ReportFile {
  _id?: string;
  pool: string;
  bucket: string;
  model_uuid: string;
  /** Display name of the model — surfaced by some endpoints (e.g. AIMBOM listing). */
  model_name?: string;
  modelName?: string;
  version: string;
  objectKey: string;
  filename: string;
  size?: number;
  contentType?: string;
  uploadedBy?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  /** Direct download URL surfaced by /models/reports for trusted-model entries. */
  download_url?: string;
}

export interface ReportListResponse {
  count: number;
  files: ReportFile[];
}

/** One report group from GET /models/reports — files grouped per (model, version). */
export interface ModelsReportGroup {
  model_name?: string;
  model_uuid: string;
  owner?: string;
  version: string;
  type: ReportType | string;
  count: number;
  files: ReportFile[];
}

export interface ModelsReportsResponse {
  total: number;
  reports: ModelsReportGroup[];
}

@Injectable({ providedIn: 'root' })
export class ModelService {
  private API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Call 1 — Register the model in MongoDB.
   * owner και model_uuid δεν στέλνονται — τα χειρίζεται το backend.
   *
   * Accepts the full metadata input object: model type, input modality,
   * architecture family, framework and an optional ethics/data questionnaire.
   */
  register(
    input: RegisterModelInput,
    token: string
  ): Observable<RegisterModelResponse> {
    const payload: RegisterModelPayload = {
      name: input.name,
      type: input.type,
      versioning: [{ version: input.version, description: input.description }]
    };

    if (input.inputModality?.length) payload.input_modality = input.inputModality;
    if (input.architectureFamily) payload.architecture_family = input.architectureFamily;
    if (input.framework) payload.framework = input.framework;
    if (input.modelParadigm) payload.model_paradigm = input.modelParadigm;
    if (input.questionnaire && Object.keys(input.questionnaire).length) {
      payload.questionnaire = input.questionnaire;
    }

    return this.http.post<RegisterModelResponse>(
      `${this.API}/models/register`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  /**
   * Call 2 — Upload requirements file στο MinIO TRP pool.
   * ΜΗΝ ορίσεις Content-Type — το browser το βάζει αυτόματα με το σωστό boundary.
   */
  uploadRequirements(
    uuid: string,
    version: string,
    file: File,
    token: string
  ): Observable<any> {
    const formData = new FormData();
    formData.append('files', file, file.name);
    
    formData.append('bucket', 'model-requirements'); 
    formData.append('pool', 'TRP'); 
    formData.append('model_uuid', uuid); 
    formData.append('version', version); 


    // console.log(uuid, version, file, token);
    
    // return this.http.post(
    //   `${this.API}/models/${uuid}/versions/${version}/requirements`,
    //   formData,
    //   { headers: { Authorization: `Bearer ${token}` } }
    // );

     return this.http.post(
      `${this.API}/files/upload`,
      formData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

  }

  /**
   * Λίστα όλων των registered models.
   */
  getAll(token: string): Observable<ModelListResponse> {
    return this.http.get<ModelListResponse>(`${this.API}/models`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  /**
   * Ένα συγκεκριμένο model — full metadata for download.
   */
  getById(uuid: string, token: string): Observable<ModelDetailsResponse> {
    return this.http.get<ModelDetailsResponse>(`${this.API}/models/${uuid}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  /**
   * Upload a file (e.g. a report) to the orchestrator's MinIO-backed
   * /files/upload endpoint, per Swagger. Body fields:
   *   - file       (binary, required)
   *   - pool       (required, e.g. "RP")
   *   - bucket     (required, e.g. "risk-reports")
   *   - model_uuid (required)
   *   - version    (required)
   *   - tags       (optional, comma-separated)
   */
  uploadFile(
    file: File,
    options: {
      model_uuid: string;
      version: string;
      pool: string;
      bucket: string;
      tags?: string;       // already comma-separated
    },
    token: string
  ): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pool', options.pool);
    formData.append('bucket', options.bucket);
    formData.append('model_uuid', options.model_uuid);
    formData.append('version', options.version);
    if (options.tags) formData.append('tags', options.tags);

    return this.http.post(
      `${this.API}/files/upload`,
      formData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  /**
   * Upload one or more files in a SINGLE multipart request to /files/upload.
   * Per the swagger, the request body accepts a `files` array along with the
   * shared pool / bucket / model_uuid / version / tags fields. The server
   * publishes a single Kafka event for the batch (bucket-keyed), so a single
   * call is the preferred path when multiple files belong to the same batch.
   */
  uploadFiles(
    files: File[],
    options: {
      model_uuid: string;
      version: string;
      pool: string;
      bucket: string;
      tags?: string;       // comma-separated
    },
    token: string
  ): Observable<any> {
    const formData = new FormData();
    for (const file of files) {
      // The swagger param name is `files` (array<binary>). Append once per file.
      formData.append('files', file, file.name);
    }
    formData.append('pool', options.pool);
    formData.append('bucket', options.bucket);
    formData.append('model_uuid', options.model_uuid);
    formData.append('version', options.version);
    if (options.tags) formData.append('tags', options.tags);

    return this.http.post(
      `${this.API}/files/upload`,
      formData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  /**
   * Create a brand-new version for an existing model.
   * POST /models/{uuid}/versions  body: { "version": "v2.0" }
   */
  createVersion(
    uuid: string,
    version: string,
    token: string
  ): Observable<any> {
    return this.http.post(
      `${this.API}/models/${encodeURIComponent(uuid)}/versions`,
      { version },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  /**
   * Upload a trusted-model file directly (TRP pool / trusted-models bucket).
   * Tied to a (model_uuid, version) pair.
   */
  uploadTrustedModel(
    file: File,
    options: { model_uuid?: string; version?: string; tags?: string },
    token: string
  ): Observable<any> {
    const formData = new FormData();
    formData.append('files', file, file.name);
    formData.append('pool', TRUSTED_MODELS_POOL);
    formData.append('bucket', TRUSTED_MODELS_BUCKET);
    if (options.model_uuid) formData.append('model_uuid', options.model_uuid);
    if (options.version)    formData.append('version', options.version);
    if (options.tags)       formData.append('tags', options.tags);

    return this.http.post(
      `${this.API}/files/upload`,
      formData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  /**
   * Upload a single raw data file to the trusted data store (TRP pool,
   * trusted-data bucket). The stored object is named "[displayName]-[filename]".
   * Used by the Data Upload screen.
   */
  uploadTrustedData(
    file: File,
    displayName: string,
    token: string
  ): Observable<any> {
    const cleanName = (displayName || '').trim();
    const storedName = cleanName ? `${cleanName}-${file.name}` : file.name;
    const renamed = new File([file], storedName, {
      type: file.type || 'application/octet-stream'
    });

    const formData = new FormData();
    formData.append('files', renamed, storedName);
    formData.append('pool', TRUSTED_DATA_POOL);
    formData.append('bucket', TRUSTED_DATA_BUCKET);

    return this.http.post(
      `${this.API}/files/upload`,
      formData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  /**
   * List files by pool / bucket (and optional extra filters).
   * GET /files?pool=&bucket=&model_uuid=&version=&uploadedBy=&tags=
   *
   * Used by the Trusted Data and AIMBOM screens. Response is normalised to
   * { count, files } whether the backend returns an array or an object.
   */
  listFiles(
    options: {
      pool?: string;
      bucket?: string;
      model_uuid?: string;
      version?: string;
      uploadedBy?: string;
      tags?: string;
    },
    token: string
  ): Observable<ReportListResponse> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<any>(
      `${this.API}/files`,
      { headers: { Authorization: `Bearer ${token}` }, params }
    ).pipe(
      map((res) => {
        if (Array.isArray(res)) {
          return { count: res.length, files: res as ReportFile[] };
        }
        const files = (res?.files ?? []) as ReportFile[];
        return { count: res?.count ?? files.length, files };
      })
    );
  }

  /**
   * Search files by any combination of fields.
   * GET /files/search?model_uuid=&version=&pool=&bucket=&uploadedBy=&tags=&from=&to=
   */
  searchFiles(
    options: {
      model_uuid?: string;
      version?: string;
      pool?: string;
      bucket?: string;
      uploadedBy?: string;
      tags?: string;       // comma-separated
      from?: string;       // ISO date
      to?: string;         // ISO date
    },
    token: string
  ): Observable<ReportListResponse> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<ReportListResponse>(
      `${this.API}/files/search`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params
      }
    );
  }

  /**
   * Get report groups across all models — used by the AIMBOM page.
   * GET /models/reports?type=&owner=&uuid=&version=
   */
  getModelsReports(
    options: {
      type?: string;
      owner?: string;
      uuid?: string;
      version?: string;
    },
    token: string
  ): Observable<ModelsReportsResponse> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<ModelsReportsResponse>(
      `${this.API}/models/reports`,
      { headers: { Authorization: `Bearer ${token}` }, params }
    );
  }

  /**
   * Get reports for a specific (model, version) and report type.
   * GET /models/{uuid}/versions/{version}/reports?type={risk|assessment|defence}
   *
   * Returns files linked to this model version by report type. Sourced from
   * the model's versioning array — not a general file search.
   */
  getReports(
    uuid: string,
    version: string,
    type: ReportType,
    token: string
  ): Observable<ReportListResponse> {
    const params = new HttpParams().set('type', type);
    return this.http.get<ReportListResponse>(
      `${this.API}/models/${encodeURIComponent(uuid)}/versions/${encodeURIComponent(version)}/reports`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params
      }
    );
  }

  /**
   * Download a stored file's binary by its MongoDB ID.
   * GET /files/download/{id}  (streams the file from MinIO).
   */
  downloadFileById(id: string, token: string): Observable<Blob> {
    return this.http.get(`${this.API}/files/download/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    });
  }

  /**
   * Download a file from an arbitrary URL (e.g. the `download_url` field on a
   * file entry returned by /models/reports). The Bearer token is still sent
   * because the orchestrator's /files/download endpoints require it.
   */
  downloadByUrl(url: string, token: string): Observable<Blob> {
    return this.http.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    });
  }

  /**
   * Get a temporary presigned download URL (valid 1h) for a file.
   * GET /files/url/{id}
   */
  getFileDownloadUrl(
    id: string,
    token: string
  ): Observable<{ url: string; expiresIn: string }> {
    return this.http.get<{ url: string; expiresIn: string }>(
      `${this.API}/files/url/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  /**
   * Trigger AIMBOM generation for a specific (model, version).
   * POST /models/{uuid}/versions/{version}/aimbom
   *
   * Returns the raw response body as text — the orchestrator may answer with
   * a JSON `{ message: ... }` or plain text. The caller is responsible for
   * surfacing it to the user.
   */
  createAimbom(
    uuid: string,
    version: string,
    token: string
  ): Observable<string> {
    return this.http.post(
      `${this.API}/models/${encodeURIComponent(uuid)}/versions/${encodeURIComponent(version)}/aimbom`,
      null,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'text'
      }
    );
  }
}
