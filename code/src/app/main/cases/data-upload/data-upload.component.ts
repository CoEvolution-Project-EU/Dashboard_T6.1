import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

import { ModelService } from '../../../services/model.service';
import { AuthDataContextService } from '../../../guard/auth-data-context.service';

@Component({
  selector: 'app-data-upload',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NgxSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './data-upload.component.html',
  styleUrl: './data-upload.component.scss'
})
export class DataUploadComponent implements OnInit {

  private fb = inject(FormBuilder);
  private modelService = inject(ModelService);
  private authCtx = inject(AuthDataContextService);
  private snackBar = inject(MatSnackBar);

  constructor(private spinner: NgxSpinnerService) {
    this.spinner.hide('assets');
  }

  uploadForm!: FormGroup;
  selectedFile: File | null = null;

  isSubmitting = false;
  errorMessage = '';

  // Success state
  uploadDone = false;
  storedName = '';

  ngOnInit(): void {
    this.uploadForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  get name() { return this.uploadForm.get('name'); }

  /** Preview of the object key that will be stored: [name]-[filename]. */
  get previewStoredName(): string {
    const n = (this.name?.value || '').trim();
    if (!this.selectedFile) return '';
    return n ? `${n}-${this.selectedFile.name}` : this.selectedFile.name;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.errorMessage = '';
    if (input.files?.length) {
      this.selectedFile = input.files[0];
    }
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.selectedFile = file;
      this.errorMessage = '';
    }
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); }

  removeFile(): void {
    this.selectedFile = null;
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  }

  async submit(): Promise<void> {
    this.errorMessage = '';

    if (this.uploadForm.invalid) {
      this.uploadForm.markAllAsTouched();
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

    const displayName = String(this.name?.value || '').trim();
    const expectedStored = `${displayName}-${this.selectedFile.name}`;

    this.modelService.uploadTrustedData(this.selectedFile, displayName, token).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.uploadDone = true;
        this.storedName = expectedStored;
        this.snackBar.open('File uploaded to trusted data.', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Data upload failed', err);
        this.isSubmitting = false;
        this.errorMessage = err?.error?.message || err?.message || 'Upload failed. Please try again.';
      }
    });
  }

  uploadAnother(): void {
    this.uploadDone = false;
    this.storedName = '';
    this.selectedFile = null;
    this.errorMessage = '';
    this.uploadForm.reset({ name: '' });
  }
}
