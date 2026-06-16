import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ModelService } from '../../../../services/model.service';
import { AuthDataContextService } from '../../../../guard/auth-data-context.service';

export interface UploadTrustedModelDialogData {
  modelUuid?: string;
  version?: string;
  modelName?: string;
}

@Component({
  selector: 'app-upload-trusted-model-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './upload-trusted-model-dialog.component.html',
  styleUrl: './upload-trusted-model-dialog.component.scss'
})
export class UploadTrustedModelDialogComponent {

  private fb = inject(FormBuilder);
  private modelService = inject(ModelService);
  private authCtx = inject(AuthDataContextService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<UploadTrustedModelDialogComponent>);
  data = inject<UploadTrustedModelDialogData>(MAT_DIALOG_DATA, { optional: true }) ?? {};

  form: FormGroup;
  selectedFile: File | null = null;
  isSubmitting = false;
  errorMessage = '';

  constructor() {
    this.form = this.fb.group({
      modelUuid: [this.data?.modelUuid ?? '', Validators.required],
      version: [this.data?.version ?? '', Validators.required]
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.errorMessage = '';
    if (input.files?.length) this.selectedFile = input.files[0];
    input.value = '';
  }

  removeFile(): void { this.selectedFile = null; }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  }

  async submit(): Promise<void> {
    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file to upload.';
      return;
    }

    this.isSubmitting = true;

    let token: string;
    try {
      token = await this.authCtx.getFreshToken();
      if (!token) throw new Error('empty token');
    } catch {
      this.isSubmitting = false;
      this.errorMessage = 'Could not retrieve auth token. Please refresh and try again.';
      return;
    }

    const modelUuid = String(this.form.value.modelUuid || '').trim();
    const version = String(this.form.value.version || '').trim();

    this.modelService.uploadTrustedModel(this.selectedFile, {
      model_uuid: modelUuid,
      version: version
    }, token).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.snackBar.open('Trusted model uploaded.', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Trusted model upload failed', err);
        this.isSubmitting = false;
        this.errorMessage = err?.error?.message || err?.message || 'Upload failed. Please try again.';
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
