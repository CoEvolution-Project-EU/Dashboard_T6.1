import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmIcon?: string;
  cancelIcon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="cd-dialog">
      <h2 class="cd-title">{{ data.title }}</h2>
      <p class="cd-body">{{ data.message }}</p>
      <div class="cd-actions">
        <button type="button" class="btn-secondary" (click)="close(false)">
          <mat-icon>{{ data.cancelIcon || 'close' }}</mat-icon>
          <span>{{ data.cancelLabel || 'No' }}</span>
        </button>
        <button type="button" class="btn-primary" (click)="close(true)">
          <mat-icon>{{ data.confirmIcon || 'check' }}</mat-icon>
          <span>{{ data.confirmLabel || 'Yes' }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .cd-dialog { padding: 20px; min-width: 360px; max-width: 480px; }
    .cd-title { margin: 0 0 8px; font-size: 1.2rem; font-weight: 700; color: var(--navbar-color); }
    .cd-body { margin: 0 0 20px; color: #4b5563; font-size: 0.95rem; line-height: 1.5; }
    .cd-actions { display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
  `]
})
export class ConfirmDialogComponent {
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<ConfirmDialogComponent>);
  close(yes: boolean): void { this.ref.close(yes); }
}
