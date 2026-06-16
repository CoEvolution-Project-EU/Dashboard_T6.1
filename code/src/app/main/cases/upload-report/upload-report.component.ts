import { Component, OnInit, inject } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgxSpinnerModule } from 'ngx-spinner';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ModelService } from '../../../services/model.service';
import { AuthDataContextService } from '../../../guard/auth-data-context.service';

/** Report categories shown to the user; each maps to a MinIO bucket. */
export type ReportCategory = 'Assessment Report' | 'AI model info' | 'Assessment Report' | 'AI model info' | 'Gadget Report' | 'EU AIact Report' | 'Datasets Report' 
// | 'Defences Report';

/** Per-file upload state shown in the UI while a batch is in flight. */
export interface FileUploadState {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  reportId?: string;
  uploadedAt?: string;
  errorMessage?: string;
}

@Component({
  selector: 'app-upload-report',
  imports: [
    CommonModule,
    RouterModule,
    NgxSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSidenavModule,
    MatTooltipModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './upload-report.component.html',
  styleUrl: './upload-report.component.scss'
})
export class UploadReportComponent implements OnInit {

  private modelService = inject(ModelService);
  private authCtx = inject(AuthDataContextService);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);

  constructor(
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
  ) {
    this.spinner.hide('assets');
  }

  isSidebarOpen = true;

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  uploadForm!: FormGroup;

  /** User-facing report categories. Each maps to a MinIO bucket. */
  readonly reportTypes: ReportCategory[] = [
    'Assessment Report',
    'AI model info',
    'Gadget Report',
    'EU AIact Report',
    'Datasets Report',
    // 'Defences Report'
  ];

  /** Pool is fixed for report uploads — kept in code, hidden from the user. */
  private readonly POOL = 'RP';

  /** Map a user-selected report category to its MinIO bucket. */
  private readonly bucketByType: Record<ReportCategory, string> = {
    'Assessment Report': 'user-assessments',
    'AI model info': 'aimodelinfo-reports',
    'Gadget Report' : 'gadgets-reports',
    'EU AIact Report': 'euaiact-reports',
    // 'Defences Report': 'user-assessments',
    'Datasets Report' : 'datasets-reports'
  };

  /** All files staged for upload. */
  selectedFiles: File[] = [];
  /** Per-file upload state for the current submission batch. */
  uploadStates: FileUploadState[] = [];

  isSubmitting = false;
  errorMessage = '';

  /** Toggles the success card; true once a batch has finished (success or partial). */
  batchComplete = false;

  ngOnInit(): void {
    this.initForm();
    // Pre-fill (model_uuid, version) when the user lands here from
    // the Model Monitoring page's per-version Upload Report shortcut.
    const qp = this.route.snapshot.queryParamMap;
    const prefillModel = qp.get('model_uuid') ?? '';
    const prefillVersion = qp.get('version') ?? '';
    if (prefillModel || prefillVersion) {
      this.uploadForm.patchValue({
        modelId: prefillModel,
        version: prefillVersion
      });
    }
  }

  private initForm(): void {
    this.uploadForm = this.fb.group({
      modelId: ['', Validators.required],
      version: ['', Validators.required],
      reportType: ['', Validators.required],
      notes: ['']
    });
  }

  /** Resolve the bucket for a given report type. Defaults to assessment-reports. */
  private resolveBucket(type: string): string {
    return this.bucketByType[type as ReportCategory] ?? 'assessment-reports';
  }

  // ── File selection ──────────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.errorMessage = '';

    if (files.length === 0) return;

    const allowedExtensions = ['pdf', 'json', 'xml'];
    const accepted: File[] = [];
    const rejected: string[] = [];

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (allowedExtensions.includes(ext)) {
        accepted.push(file);
      } else {
        rejected.push(file.name);
      }
    }

    if (rejected.length) {
      this.errorMessage = `Only PDF, JSON, or XML files are allowed. Skipped: ${rejected.join(', ')}`;
    }

    // Append to the existing selection — but de-duplicate by name+size+lastModified.
    const existingKeys = new Set(this.selectedFiles.map(f => this.fileKey(f)));
    for (const f of accepted) {
      const k = this.fileKey(f);
      if (!existingKeys.has(k)) {
        this.selectedFiles.push(f);
        existingKeys.add(k);
      }
    }

    // Clear the native input so picking the same file again triggers (change).
    input.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  clearFiles(): void {
    this.selectedFiles = [];
  }

  fileKey(f: File): string {
    return `${f.name}|${f.size}|${f.lastModified}`;
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  }

  // ── Submission ──────────────────────────────────────────────────────────

  async submit(): Promise<void> {
    this.errorMessage = '';

    if (this.uploadForm.invalid) {
      this.uploadForm.markAllAsTouched();
      return;
    }

    if (this.selectedFiles.length === 0) {
      this.errorMessage = 'Please select at least one report file.';
      return;
    }

    this.isSubmitting = true;
    this.batchComplete = false;

    // ── Get token ────────────────────────────────────────────────────────
    let token: string;
    try {
      token = await this.authCtx.getFreshToken();
      if (!token) throw new Error('empty token');
    } catch {
      this.isSubmitting = false;
      this.errorMessage = 'Could not retrieve auth token. Please refresh and try again.';
      return;
    }

    const { modelId, version, reportType, notes } = this.uploadForm.value;
    const pool = this.POOL;
    const bucket = this.resolveBucket(reportType);

    // Build comma-separated tags shared across all files in this batch.
    const tagParts: string[] = [];
    if (reportType) tagParts.push(`type:${this.sanitizeTag(reportType)}`);
    if (notes) tagParts.push(`notes:${this.sanitizeTag(notes)}`);
    const tags = tagParts.join(',');

    // Track per-file rows for the UI; the actual request is one batch POST.
    this.uploadStates = this.selectedFiles.map(file => ({ file, status: 'uploading' }));

    await this.uploadBatch(this.selectedFiles, { modelId, version, pool, bucket, tags }, token);

    this.isSubmitting = false;
    this.batchComplete = true;

    const okCount = this.uploadStates.filter(s => s.status === 'success').length;
    const failCount = this.uploadStates.length - okCount;
    if (failCount === 0) {
      this.snackBar.open(`Uploaded ${okCount} report${okCount === 1 ? '' : 's'}.`, 'Close', { duration: 3000 });
    } else {
      this.snackBar.open(`Upload failed for the batch.`, 'Close', { duration: 4000 });
    }
  }

  /**
   * Send all files in a SINGLE POST to /files/upload. The request either
   * succeeds — and every file is marked uploaded — or fails as one batch.
   */
  private uploadBatch(
    files: File[],
    options: { modelId: string; version: string; pool: string; bucket: string; tags: string },
    token: string
  ): Promise<void> {
    return new Promise(resolve => {
      this.modelService.uploadFiles(files, {
        model_uuid: options.modelId,
        version: options.version,
        pool: options.pool,
        bucket: options.bucket,
        tags: options.tags
      }, token).subscribe({
        next: (response: any) => {
          // The orchestrator may return a per-file array or a single batch
          // descriptor. Map back to our per-file state defensively.
          const perFileResults: any[] = Array.isArray(response?.files)
            ? response.files
            : Array.isArray(response) ? response : [];

          const batchUploadedAt = response?.uploadedAt ?? new Date().toISOString();

          this.uploadStates = this.uploadStates.map((state, idx) => {
            const match = perFileResults[idx] || {};
            return {
              ...state,
              status: 'success',
              reportId: match.reportId ?? match._id ?? match.file_id ?? response?.batchId ?? `REP-${Date.now()}-${idx}`,
              uploadedAt: match.uploadedAt ?? batchUploadedAt
            };
          });
          resolve();
        },
        error: (err) => {
          console.error('Batch upload failed', err);
          const errMessage = err?.error?.message || err?.message || 'Upload failed.';
          this.uploadStates = this.uploadStates.map(state => ({
            ...state,
            status: 'error',
            errorMessage: errMessage
          }));
          resolve();
        }
      });
    });
  }

  /** Retry the whole batch (kept on the success card when it ended in error). */
  async retryBatch(): Promise<void> {
    if (!this.uploadStates.some(s => s.status === 'error')) return;

    const { modelId, version, reportType, notes } = this.uploadForm.value;
    const pool = this.POOL;
    const bucket = this.resolveBucket(reportType);
    const tagParts: string[] = [];
    if (reportType) tagParts.push(`type:${this.sanitizeTag(reportType)}`);
    if (notes) tagParts.push(`notes:${this.sanitizeTag(notes)}`);
    const tags = tagParts.join(',');

    let token: string;
    try {
      token = await this.authCtx.getFreshToken();
      if (!token) throw new Error('empty token');
    } catch {
      this.snackBar.open('Could not retrieve auth token.', 'Close', { duration: 3500 });
      return;
    }

    this.isSubmitting = true;
    this.batchComplete = false;
    this.uploadStates = this.uploadStates.map(s => ({ ...s, status: 'uploading', errorMessage: undefined }));

    await this.uploadBatch(this.selectedFiles, { modelId, version, pool, bucket, tags }, token);

    this.isSubmitting = false;
    this.batchComplete = true;
  }

  /** Strip commas (the tag delimiter) and trim. */
  private sanitizeTag(value: string): string {
    return String(value).replace(/,/g, ' ').trim();
  }

  uploadAnother(): void {
    this.batchComplete = false;
    this.uploadStates = [];
    this.selectedFiles = [];
    this.errorMessage = '';
    this.uploadForm.reset();
  }

  // ── Form getters ────────────────────────────────────────────────────────

  get modelId() { return this.uploadForm.get('modelId'); }
  get reportType() { return this.uploadForm.get('reportType'); }
  get version() { return this.uploadForm.get('version'); }

  // ── Summary helpers ─────────────────────────────────────────────────────

  get successCount(): number {
    return this.uploadStates.filter(s => s.status === 'success').length;
  }

  get failureCount(): number {
    return this.uploadStates.filter(s => s.status === 'error').length;
  }

  trackByFileKey = (_: number, state: FileUploadState): string => this.fileKey(state.file);
}
