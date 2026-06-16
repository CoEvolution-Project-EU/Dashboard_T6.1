import { Component, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ReportFile } from '../../../../services/model.service';

export interface ReportPreviewData {
  file: ReportFile;
  blob: Blob;
}

type PreviewKind = 'pdf' | 'image' | 'text' | 'unsupported';

@Component({
  selector: 'app-report-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './report-preview-dialog.component.html',
  styleUrl: './report-preview-dialog.component.scss'
})
export class ReportPreviewDialogComponent implements OnDestroy {

  kind: PreviewKind = 'unsupported';
  blobUrl = '';
  safeUrl: SafeResourceUrl | null = null;
  textContent = '';
  textLoading = false;

  get filename(): string { return this.data.file.filename; }
  get contentType(): string { return this.data.file.contentType ?? ''; }
  get size(): string { return this.formatSize(this.data.file.size); }
  get uploadedAt(): string { return this.data.file.createdAt ?? ''; }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ReportPreviewData,
    private dialogRef: MatDialogRef<ReportPreviewDialogComponent>,
    private sanitizer: DomSanitizer
  ) {
    this.kind = this.detectKind(data.file, data.blob);
    this.blobUrl = URL.createObjectURL(data.blob);

    if (this.kind === 'pdf' || this.kind === 'image') {
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl);
    } else if (this.kind === 'text') {
      this.textLoading = true;
      data.blob.text().then(t => {
        // Pretty-print JSON if it parses cleanly.
        try {
          this.textContent = JSON.stringify(JSON.parse(t), null, 2);
        } catch {
          this.textContent = t;
        }
        this.textLoading = false;
      });
    }
  }

  ngOnDestroy(): void {
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
  }

  download(): void {
    const a = document.createElement('a');
    a.href = this.blobUrl;
    a.download = this.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  close(): void {
    this.dialogRef.close();
  }

  private detectKind(file: ReportFile, blob: Blob): PreviewKind {
    const ct = (file.contentType || blob.type || '').toLowerCase();
    const name = (file.filename || '').toLowerCase();

    if (ct.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
    if (ct.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(name)) return 'image';
    if (
      ct.includes('json') || ct.startsWith('text/') ||
      ct.includes('xml') || ct.includes('csv') ||
      /\.(json|txt|md|csv|xml|log)$/i.test(name)
    ) return 'text';
    return 'unsupported';
  }

  private formatSize(bytes?: number): string {
    if (!bytes && bytes !== 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  }
}
