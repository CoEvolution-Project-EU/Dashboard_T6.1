import { Component, OnInit, inject } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgxSpinnerModule } from 'ngx-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ModelService } from '../../../services/model.service';
import { AuthDataContextService } from '../../../guard/auth-data-context.service';
import { QuestionnaireDialogComponent } from './questionnaire-dialog/questionnaire-dialog.component';

@Component({
  selector: 'app-register-model',
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
    MatSnackBarModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './register-model.component.html',
  styleUrl: './register-model.component.scss'
})
export class RegisterModelComponent implements OnInit {

  constructor(private spinner: NgxSpinnerService) {
    this.spinner.hide('assets');
  }

  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private modelService = inject(ModelService);
  private authCtx = inject(AuthDataContextService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  /** Navigate to the Model Monitoring screen (used on the success card). */
  goToMonitoring(): void {
    this.router.navigate(['/model-monitoring']);
  }

  isSidebarOpen = true;
  isSubmitting = false;   // Step 1 spinner
  isSuccess = false;   // to Step 2
  isUploading = false;   // Step 2 spinner
  uploadDone = false;   // Step 2 complete

  // ── Model data (set after Step 1) ──────────────────────────────
  registeredModelId = '';
  registeredModelVersion = '';
  submittedData: {
    modelName: string;
    type: string;
    version: string;
    description: string;
  } | null = null;

  // ── Step 2 file ───────────────────────────────────────────────────────────
  selectedFile: File | null = null;
  uploadedFileName = '';

  readonly modelTypes = [
    { value: 'classification', label: 'Classification' },
    { value: 'object_detection', label: 'Object Detection' },
    { value: 'segmentation', label: 'Segmentation' },
    { value: 'tracking', label: 'Tracking' },
    { value: 'forecasting', label: 'Forecasting' },
    { value: 'anomaly_detection', label: 'Anomaly Detection' },
    { value: 'regression', label: 'Regression' },
    { value: 'other', label: 'Other' }
  ];

  /** Multi-select options for input modality. */
  readonly inputModalities = [
    'RGB Image',
    'Video',
    'LiDAR Point Cloud',
    'LiDAR Range Image',
    'Radar Data',
    'Text',
    'Tabular Data',
    'Time-series Data',
    'Graph'
  ];

  readonly architectureFamilies = [
    'CNN',
    'Transformer',
    'GNN',
    'RNN/LSTM',
    'Classical ML',
    'Hybrid Model'
  ];

  readonly frameworks = [
    'PyTorch',
    'TensorFlow',
    'Keras',
    'Scikit-learn',
    'ONNX',
    'Custom'
  ];

  readonly modelParadigms = [
    'Single model paradigm',
    'Collaborative learning paradigm',
    'Interconnected AI agents paradigm',
    'Single & Collaborative paradigm'
  ];

  /** Answers captured from the (optional) ethics/data questionnaire. */
  questionnaireAnswers: Record<string, unknown> | null = null;

  // ── Step 1 form ───────────────────────────────────────────────────────────
  registerForm!: FormGroup;

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      modelName: ['', Validators.required],
      type: ['', Validators.required],
      customType: [''],
      inputModality: [[] as string[], Validators.required],
      architectureFamily: ['', Validators.required],
      framework: ['', Validators.required],
      modelParadigm: ['', Validators.required],
      version: ['', Validators.required],
      description: ['']
    });

    // Make the free-text "custom type" required only when "Other" is selected.
    this.registerForm.get('type')!.valueChanges.subscribe((value: string) => {
      const customType = this.registerForm.get('customType')!;
      if (value === 'other') {
        customType.setValidators([Validators.required]);
      } else {
        customType.clearValidators();
        customType.setValue('');
      }
      customType.updateValueAndValidity();
    });
  }

  get f() { return this.registerForm.controls; }

  /** True when the user picked "Other" for the model type. */
  get isOtherType(): boolean {
    return this.registerForm?.get('type')?.value === 'other';
  }

  /** Number of answered questionnaire items (for the button label). */
  get questionnaireCount(): number {
    return this.questionnaireAnswers ? Object.keys(this.questionnaireAnswers).length : 0;
  }

  /** Open the ethics/data questionnaire modal. */
  openQuestionnaire(): void {
    const ref = this.dialog.open(QuestionnaireDialogComponent, {
      data: { answers: this.questionnaireAnswers ?? {} },
      panelClass: 'questionnaire-dialog-panel',
      maxWidth: '95vw',
      autoFocus: false
    });

    ref.afterClosed().subscribe((answers: Record<string, unknown> | null) => {
      if (answers) {
        this.questionnaireAnswers = answers;
        const n = Object.keys(answers).length;
        this.snackBar.open(
          n > 0 ? `Saved ${n} questionnaire answer${n === 1 ? '' : 's'}.` : 'Questionnaire cleared.',
          'Close',
          { duration: 2500 }
        );
      }
    });
  }

  // ── Register model ─────────────────────────────────────────────────

  async registerModel(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.snackBar.open('Please complete all required fields.', 'Close', { duration: 3500 });
      return;
    }

  // ── Get token ─────────────────────────────────────────────────
    
    let token: string;
    try {
      token = await this.authCtx.getFreshToken();
      if (!token) throw new Error('empty token');
    } catch {
      this.isSubmitting = false;
      this.snackBar.open('Could not retrieve auth token. Please refresh and try again.', 'Close', { duration: 4000 });
      return;
    }

    const {
      modelName, type, customType, inputModality,
      architectureFamily, framework, modelParadigm, version, description
    } = this.registerForm.value;

    // When "Other" is selected, send the user-provided free-text type.
    const resolvedType = type === 'other' ? String(customType || '').trim() : type;

    this.modelService.register({
      name: modelName,
      type: resolvedType,
      version,
      description: description || '',
      inputModality: inputModality || [],
      architectureFamily,
      framework,
      modelParadigm,
      questionnaire: this.questionnaireAnswers ?? undefined
    }, token).subscribe({
      next: (response) => {
        this.registeredModelId = response.model.model_uuid;
        this.registeredModelVersion = response.model.versioning[0].version;
        this.submittedData = { modelName, type: resolvedType, version: this.registeredModelVersion, description: description || '' };

        this.modelService
          .uploadRequirements( this.registeredModelId, this.registeredModelVersion, this.selectedFile, token)
          .subscribe({
            next: (respon) => {

              this.uploadedFileName = this.selectedFile!['name'];
              this.isUploading = false;
              this.uploadDone = true;
              this.snackBar.open('File uploaded successfully!', 'Close', { duration: 3000 });
              this.isSuccess = true;   // → Step 2
           
            },
            error: (err) => {
              console.error('File upload failed', err);
              this.isUploading = false;
              this.snackBar.open('File upload failed. Please try again.', 'Close', { duration: 4000 });
            }
          });




        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Model registration failed', err);
        this.isSubmitting = false;
        this.snackBar.open('Registration failed. Please try again.', 'Close', { duration: 3500 });
      }
    });

    this.isSubmitting = true;
  }

  // ── STEP 2: Upload requirements file ──────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.setFile(input.files[0]);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.setFile(file);
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); }

  private setFile(file: File): void {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      this.snackBar.open('Only .zip files are accepted.', 'Close', { duration: 3000 });
      return;
    }
    this.selectedFile = file;
  }

  // async uploadRequirements(): Promise<void> {
  //   if (!this.selectedFile) return;

  //   this.isUploading = true;

  //   let token: string;
  //   try {
  //     token = await this.authCtx.getFreshToken();
  //     if (!token) throw new Error('empty token');
  //   } catch {
  //     this.isUploading = false;
  //     this.snackBar.open('Could not retrieve auth token. Please refresh and try again.', 'Close', { duration: 4000 });
  //     return;
  //   }

  //   this.modelService
  //     .uploadRequirements(this.registeredModelId, this.registeredModelVersion, this.selectedFile, token)
  //     .subscribe({
  //       next: () => {
  //         this.uploadedFileName = this.selectedFile!.name;
  //         this.isUploading      = false;
  //         this.uploadDone       = true;
  //         this.snackBar.open('File uploaded successfully!', 'Close', { duration: 3000 });
  //       },
  //       error: (err) => {
  //         console.error('File upload failed', err);
  //         this.isUploading = false;
  //         this.snackBar.open('File upload failed. Please try again.', 'Close', { duration: 4000 });
  //       }
  //     });
  // }

  // ── Helpers ────────────────────────────────────────────────────────────────

  registerAnother(): void {
    this.isSuccess = false;
    this.uploadDone = false;
    this.registeredModelId = '';
    this.registeredModelVersion = '';
    this.selectedFile = null;
    this.uploadedFileName = '';
    this.submittedData = null;
    this.questionnaireAnswers = null;
    this.registerForm.reset({
      modelName: '', type: '', customType: '',
      inputModality: [], architectureFamily: '', framework: '',
      modelParadigm: '',
      version: '', description: ''
    });
  }

  copyModelId(): void {
    if (!this.registeredModelId) return;
    navigator.clipboard.writeText(this.registeredModelId);
    this.snackBar.open('Model ID copied to clipboard.', 'Close', { duration: 2000 });
  }
}
