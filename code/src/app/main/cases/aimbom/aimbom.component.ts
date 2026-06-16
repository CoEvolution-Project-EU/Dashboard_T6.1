import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
  ReportFile
} from '../../../services/model.service';

/** A flattened row: one file enriched with the parent (model, version) context. */
interface AimbomRow extends ReportFile {
  modelName?: string;
}
import { AuthDataContextService } from '../../../guard/auth-data-context.service';
import { ReportPreviewDialogComponent } from '../model-monitoring/report-preview-dialog/report-preview-dialog.component';
import { UploadTrustedModelDialogComponent } from './upload-trusted-model-dialog/upload-trusted-model-dialog.component';

@Component({
  selector: 'app-aimbom',
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
  templateUrl: './aimbom.component.html',
  styleUrl: './aimbom.component.scss'
})
export class AimbomComponent implements OnInit {

  private modelService = inject(ModelService);
  private authCtx = inject(AuthDataContextService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  constructor(private spinner: NgxSpinnerService) {
    this.spinner.hide('assets');
  }

  aimboms: AimbomRow[] = [];
  filtered: AimbomRow[] = [];

  isLoading = false;
  errorMessage = '';

  searchTerm = '';
  busyFileKey: string | null = null;

  displayedColumns: string[] = ['filename', 'modelName', 'model_uuid', 'version', 'size', 'createdAt', 'actions'];

  /** Best-effort model name lookup — backend may ship modelName, model_name, or none. */
  modelNameOf(f: AimbomRow): string {
    return f.modelName || (f as any).model_name || '';
  }

  openUploadTrustedModel(prefill?: { modelUuid?: string; version?: string; modelName?: string }): void {
    const ref = this.dialog.open(UploadTrustedModelDialogComponent, {
      data: prefill ?? {},
      panelClass: 'upload-trusted-model-dialog-panel',
      autoFocus: false
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) this.loadAimboms();
    });
  }

  /** Prefill helper for a per-row upload trusted model action. */
  uploadFor(file: AimbomRow): void {
    this.openUploadTrustedModel({
      modelUuid: file.model_uuid,
      version: file.version,
      modelName: this.modelNameOf(file)
    });
  }

  ngOnInit(): void {
    this.loadAimboms();
  }

  async loadAimboms(): Promise<void> {
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

    this.modelService.getModelsReports({ type: 'aimbom' }, token).subscribe({
      next: (response) => {
        // Flatten reports[].files[] → one row per file enriched with the
        // parent (model_name, model_uuid, version) so the table can render it.
        const rows: AimbomRow[] = [];
        for (const report of response?.reports ?? []) {
          for (const file of report?.files ?? []) {
            rows.push({
              ...file,
              model_uuid: file.model_uuid || report.model_uuid,
              version: file.version || report.version,
              modelName: report.model_name
            });
          }
        }
        this.aimboms = rows;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load AIMBOMs', err);
        this.isLoading = false;
        this.errorMessage = 'Could not load AIMBOMs. Please try again.';
      }
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = this.aimboms.filter(f => {
      if (!term) return true;
      const haystack = [
        f.filename, f.model_uuid, f.version, f.uploadedBy, f.objectKey, f.modelName ?? ''
      ].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  refresh(): void {
    this.loadAimboms();
  }

  fileKey(f: ReportFile): string {
    return f._id ?? f.objectKey;
  }

  formatSize(bytes?: number): string {
    if (bytes === undefined || bytes === null) return '—';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  }

  copy(value: string, label: string = 'Value'): void {
    if (!value) return;
    navigator.clipboard.writeText(value).then(
      () => this.snackBar.open(`${label} copied to clipboard.`, 'Close', { duration: 2000 }),
      () => this.snackBar.open(`Could not copy ${label.toLowerCase()}.`, 'Close', { duration: 2500 })
    );
  }

  /** Open a preview dialog for an AIMBOM file. */
  async preview(file: AimbomRow): Promise<void> {
    if (!file._id) {
      this.snackBar.open('File is missing an id and cannot be previewed.', 'Close', { duration: 3500 });
      return;
    }
    this.busyFileKey = this.fileKey(file);

    let token: string;
    try {
      token = await this.authCtx.getFreshToken();
      if (!token) throw new Error('empty token');
    } catch {
      this.busyFileKey = null;
      this.snackBar.open('Could not retrieve auth token.', 'Close', { duration: 3500 });
      return;
    }

    this.modelService.downloadFileById(file._id, token).subscribe({
      next: (blob) => {
        this.busyFileKey = null;
        this.dialog.open(ReportPreviewDialogComponent, {
          data: { file, blob },
          panelClass: 'report-preview-dialog-panel',
          maxWidth: '95vw',
          maxHeight: '95vh'
        });
      },
      error: (err) => {
        console.error('AIMBOM preview fetch failed', err);
        this.busyFileKey = null;
        this.snackBar.open('Could not load AIMBOM for preview.', 'Close', { duration: 3500 });
      }
    });
  }

  /** Download an AIMBOM file directly. */
  async download(file: AimbomRow): Promise<void> {
    if (!file._id) {
      this.snackBar.open('File is missing an id and cannot be downloaded.', 'Close', { duration: 3500 });
      return;
    }
    this.busyFileKey = this.fileKey(file);

    let token: string;
    try {
      token = await this.authCtx.getFreshToken();
      if (!token) throw new Error('empty token');
    } catch {
      this.busyFileKey = null;
      this.snackBar.open('Could not retrieve auth token.', 'Close', { duration: 3500 });
      return;
    }

    this.modelService.downloadFileById(file._id, token).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename || file.objectKey;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.busyFileKey = null;
      },
      error: (err) => {
        console.error('AIMBOM download failed', err);
        this.busyFileKey = null;
        this.snackBar.open('Could not download AIMBOM.', 'Close', { duration: 3500 });
      }
    });
  }

  trackByFile = (_: number, f: AimbomRow): string => this.fileKey(f);
}
