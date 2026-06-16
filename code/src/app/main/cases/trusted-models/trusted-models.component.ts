import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

import {
  ModelService,
  ReportFile,
  ModelsReportGroup
} from '../../../services/model.service';
import { AuthDataContextService } from '../../../guard/auth-data-context.service';
import { UploadTrustedModelDialogComponent } from '../aimbom/upload-trusted-model-dialog/upload-trusted-model-dialog.component';
import { NewVersionDialogComponent } from '../model-monitoring/new-version-dialog/new-version-dialog.component';

/** One row = one file from /models/reports?type=trusted-model. */
interface TrustedModelRow {
  modelName?: string;
  modelUuid: string;
  owner?: string;
  version: string;
  file: ReportFile;
}

@Component({
  selector: 'app-trusted-models',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgxSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './trusted-models.component.html',
  styleUrl: './trusted-models.component.scss'
})
export class TrustedModelsComponent implements OnInit {

  private modelService = inject(ModelService);
  private authCtx = inject(AuthDataContextService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  constructor(private spinner: NgxSpinnerService) {
    this.spinner.hide('assets');
  }

  rows: TrustedModelRow[] = [];
  filtered: TrustedModelRow[] = [];

  isLoading = false;
  errorMessage = '';

  searchTerm = '';
  busyFileId: string | null = null;
  newVersionBusyUuid: string | null = null;

  displayedColumns: string[] = [
    'filename', 'modelName', 'modelUuid', 'version',
    'uploadedBy', 'createdAt', 'actions'
  ];

  ngOnInit(): void {
    this.loadTrustedModels();
  }

  async loadTrustedModels(): Promise<void> {
    this.errorMessage = '';
    this.isLoading = true;

    let token: string;
    try {
      token = await this.authCtx.getFreshToken();
      if (!token) throw new Error('empty token');
    } catch {
      this.isLoading = false;
      this.errorMessage = 'Could not retrieve auth token. Please refresh and try again.';
      return;
    }

    this.modelService.getModelsReports({ type: 'trusted-model' }, token).subscribe({
      next: (response: any) => {
        this.rows = this.flatten(this.extractGroups(response));
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load trusted-model reports', err);
        this.isLoading = false;
        this.errorMessage = 'Could not load trusted models. Please try again.';
      }
    });
  }

  /**
   * The endpoint may answer as {total, reports: [...]} (like AIMBOM), as a
   * raw array, or as a single report object. Normalise to an array of groups.
   */
  private extractGroups(response: any): ModelsReportGroup[] {
    if (!response) return [];
    if (Array.isArray(response.reports)) return response.reports;
    if (Array.isArray(response)) return response;
    if (response.files && Array.isArray(response.files)) {
      return [response as ModelsReportGroup];
    }
    return [];
  }

  /** Flatten each report group into one row per file. */
  private flatten(groups: ModelsReportGroup[]): TrustedModelRow[] {
    const out: TrustedModelRow[] = [];
    for (const g of groups) {
      const files = g?.files ?? [];
      for (const file of files) {
        out.push({
          modelName: g.model_name,
          modelUuid: g.model_uuid,
          owner: g.owner,
          version: g.version,
          file
        });
      }
    }
    return out;
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = this.rows.filter(r => {
      if (!term) return true;
      const haystack = [
        r.modelName ?? '', r.modelUuid, r.owner ?? '', r.version,
        r.file.filename, r.file.uploadedBy ?? '', r.file._id ?? ''
      ].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  refresh(): void {
    this.loadTrustedModels();
  }

  copy(value: string, label: string = 'Value'): void {
    if (!value) return;
    navigator.clipboard.writeText(value).then(
      () => this.snackBar.open(`${label} copied to clipboard.`, 'Close', { duration: 2000 }),
      () => this.snackBar.open(`Could not copy ${label.toLowerCase()}.`, 'Close', { duration: 2500 })
    );
  }

  formatSize(bytes?: number): string {
    if (bytes === undefined || bytes === null) return '—';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  }

  /**
   * Download the trusted-model file. Prefer the `download_url` shipped by the
   * /models/reports response — it points at the orchestrator's download
   * endpoint that streams the real MinIO object — and save the result with
   * the file's original filename so the user gets e.g. `LENet_segmentation.pth`.
   */
  async downloadTrustedModel(row: TrustedModelRow): Promise<void> {
    const id = row.file._id ?? '';
    this.busyFileId = id || row.file.filename;

    let token: string;
    try {
      token = await this.authCtx.getFreshToken();
      if (!token) throw new Error('empty token');
    } catch {
      this.busyFileId = null;
      this.snackBar.open('Could not retrieve auth token.', 'Close', { duration: 3500 });
      return;
    }

    const url = row.file.download_url;
    const obs$ = url
      ? this.modelService.downloadByUrl(url, token)
      : (id ? this.modelService.downloadFileById(id, token) : null);

    if (!obs$) {
      this.busyFileId = null;
      this.snackBar.open('No download URL available for this file.', 'Close', { duration: 3500 });
      return;
    }

    obs$.subscribe({
      next: (blob) => {
        const downloadName = row.file.filename || row.file.objectKey || `${id || 'file'}.bin`;
        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objUrl);
        this.busyFileId = null;
      },
      error: (err) => {
        console.error('Trusted-model download failed', err);
        this.busyFileId = null;
        const msg = err?.error?.message || err?.message || 'Could not download trusted model.';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  /** Jump to Upload Report with the model UUID + version pre-filled. */
  uploadReport(row: TrustedModelRow): void {
    this.router.navigate(['/upload-report'], {
      queryParams: {
        model_uuid: row.modelUuid,
        version: row.version
      }
    });
  }

  /** Open the New Version dialog for the registered model linked to this file. */
  createNewVersion(row: TrustedModelRow): void {
    const ref = this.dialog.open(NewVersionDialogComponent, {
      data: {
        modelName: row.modelName || row.modelUuid,
        modelUuid: row.modelUuid,
        existingVersions: [row.version].filter(Boolean) as string[]
      },
      autoFocus: true
    });
    ref.afterClosed().subscribe(async (version: string | null) => {
      if (!version) return;
      await this.postNewVersion(row.modelUuid, version);
    });
  }

  private async postNewVersion(uuid: string, version: string): Promise<void> {
    this.newVersionBusyUuid = uuid;
    let token: string;
    try {
      token = await this.authCtx.getFreshToken();
      if (!token) throw new Error('empty token');
    } catch {
      this.newVersionBusyUuid = null;
      this.snackBar.open('Could not retrieve auth token.', 'Close', { duration: 3500 });
      return;
    }

    this.modelService.createVersion(uuid, version, token).subscribe({
      next: () => {
        this.newVersionBusyUuid = null;
        this.snackBar.open(`Version ${version} created.`, 'Close', { duration: 3000 });
        this.loadTrustedModels();
      },
      error: (err) => {
        console.error('Create version failed', err);
        this.newVersionBusyUuid = null;
        const message = err?.error?.message || err?.message || 'Could not create version.';
        this.snackBar.open(message, 'Close', { duration: 4000 });
      }
    });
  }

  /** Open the Upload Trusted Model dialog (optionally prefilled from a row). */
  openUploadTrustedModel(row?: TrustedModelRow): void {
    const data = row ? {
      modelUuid: row.modelUuid,
      version: row.version,
      modelName: row.modelName
    } : {};
    const ref = this.dialog.open(UploadTrustedModelDialogComponent, {
      data,
      panelClass: 'upload-trusted-model-dialog-panel',
      autoFocus: false
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) this.loadTrustedModels();
    });
  }

  trackByRow = (_: number, r: TrustedModelRow): string =>
    `${r.modelUuid}|${r.version}|${r.file._id ?? r.file.objectKey}`;
}
