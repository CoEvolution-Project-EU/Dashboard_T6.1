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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

import {
  ModelService,
  ReportFile,
  TRUSTED_DATA_POOL,
  TRUSTED_DATA_BUCKET
} from '../../../services/model.service';
import { AuthDataContextService } from '../../../guard/auth-data-context.service';

@Component({
  selector: 'app-data',
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
    MatSnackBarModule
  ],
  templateUrl: './data.component.html',
  styleUrl: './data.component.scss'
})
export class DataComponent implements OnInit {

  private modelService = inject(ModelService);
  private authCtx = inject(AuthDataContextService);
  private snackBar = inject(MatSnackBar);

  constructor(private spinner: NgxSpinnerService) {
    this.spinner.hide('assets');
  }

  files: ReportFile[] = [];
  filtered: ReportFile[] = [];

  isLoading = false;
  errorMessage = '';

  searchTerm = '';
  busyFileKey: string | null = null;

  displayedColumns: string[] = ['filename', 'size', 'uploadedBy', 'createdAt', 'actions'];

  ngOnInit(): void {
    this.loadFiles();
  }

  async loadFiles(): Promise<void> {
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

    this.modelService.listFiles(
      { pool: TRUSTED_DATA_POOL, bucket: TRUSTED_DATA_BUCKET },
      token
    ).subscribe({
      next: (response) => {
        this.files = response?.files ?? [];
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load trusted data', err);
        this.isLoading = false;
        this.errorMessage = 'Could not load data. Please try again.';
      }
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = this.files.filter(f => {
      if (!term) return true;
      const haystack = [f.filename, f.uploadedBy, f.objectKey, ...(f.tags ?? [])]
        .join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  refresh(): void {
    this.loadFiles();
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

  async download(file: ReportFile): Promise<void> {
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
        console.error('Data download failed', err);
        this.busyFileKey = null;
        this.snackBar.open('Could not download file.', 'Close', { duration: 3500 });
      }
    });
  }

  trackByFile = (_: number, f: ReportFile): string => this.fileKey(f);
}
