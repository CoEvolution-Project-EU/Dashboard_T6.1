import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

export interface DescriptionDialogData {
  title: string;
  subtitle?: string;
  body: string;
}

@Component({
  selector: 'app-description-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, MatDialogModule],
  template: `
    <div class="dd-dialog">
      <div class="dd-header">
        <div class="dd-header-text">
          <h2 class="dd-title">{{ data.title }}</h2>
          <p class="dd-subtitle" *ngIf="data.subtitle">{{ data.subtitle }}</p>
        </div>
        <button type="button" class="btn-icon-table" (click)="close()" matTooltip="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="dd-body">{{ data.body }}</div>
      <div class="dd-actions">
        <button type="button" class="btn-primary" (click)="close()">
          <mat-icon>check</mat-icon>
          <span>Close</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dd-dialog { padding: 16px; min-width: 420px; max-width: 640px; }
    .dd-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
    .dd-header-text { min-width: 0; }
    .dd-title { margin: 0; font-size: 1.2rem; font-weight: 700; color: var(--navbar-color); }
    .dd-subtitle { margin: 4px 0 0; color: #6b7280; font-size: 0.88rem; }
    .dd-body {
      color: #1f2937;
      font-size: 0.95rem;
      line-height: 1.55;
      white-space: pre-line;
      max-height: 60vh;
      overflow-y: auto;
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 14px;
    }
    .dd-actions { display: flex; justify-content: flex-end; }
  `]
})
export class DescriptionDialogComponent {
  data = inject<DescriptionDialogData>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<DescriptionDialogComponent>);
  close(): void { this.ref.close(); }
}
