import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

export interface NewVersionDialogData {
  modelName: string;
  modelUuid: string;
  existingVersions?: string[];
}

@Component({
  selector: 'app-new-version-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './new-version-dialog.component.html',
  styleUrl: './new-version-dialog.component.scss'
})
export class NewVersionDialogComponent {

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<NewVersionDialogComponent>);
  data = inject<NewVersionDialogData>(MAT_DIALOG_DATA);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      version: ['', [Validators.required]]
    });
  }

  /** True when the entered version already exists for this model. */
  get duplicate(): boolean {
    const v = String(this.form.value.version || '').trim();
    return !!v && (this.data.existingVersions ?? []).includes(v);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const version = String(this.form.value.version || '').trim();
    if (!version) return;
    if (this.duplicate) return;
    this.dialogRef.close(version);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
