import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

import {
  ModelService,
  RegisteredModel,
  ModelVersion,
  ReportFile,
  ReportType
} from '../../../services/model.service';
import { AuthDataContextService } from '../../../guard/auth-data-context.service';
import { ReportPreviewDialogComponent } from './report-preview-dialog/report-preview-dialog.component';
import { NewVersionDialogComponent } from './new-version-dialog/new-version-dialog.component';
import { UploadTrustedModelDialogComponent } from '../aimbom/upload-trusted-model-dialog/upload-trusted-model-dialog.component';

/** Flat row structure: one per (model, version) pair. */
interface ModelVersionRow {
  model: RegisteredModel;
  version: ModelVersion;
  versionIndex: number;
  isFirstRow: boolean;       // first row for this model — show name/uuid/owner/type
  totalVersions: number;
}

/** Reports for a (uuid, version) grouped by type, plus loading/error state. */
interface ReportsBucket {
  loading: boolean;
  error?: string;
  byType: Record<string, ReportFile[]>;
  /** Memoised groups — computed once when files load so the template
   *  doesn't recreate arrays on every change-detection cycle. */
  groups: (ReportGroupMeta & { items: ReportFile[] })[];
}

/** Display metadata for each report group (label / icon / colour key / type). */
interface ReportGroupMeta {
  key: ReportType;
  label: string;
  icon: string;
  color: string;
}

const REPORT_GROUP_META: ReportGroupMeta[] = [
  { key: 'risk',        label: 'Risk',          icon: 'warning_amber', color: 'risk'        },
  { key: 'assessment',  label: 'Assessment',    icon: 'fact_check',    color: 'assessment'  },
  { key: 'defence',     label: 'Defence',       icon: 'shield',        color: 'defence'     },
  { key: 'gadgets',     label: 'Gadgets',       icon: 'extension',     color: 'gadgets'     },
  { key: 'aimodelinfo', label: 'AI Model Info', icon: 'smart_toy',     color: 'aimodelinfo' },
  { key: 'euaiact',     label: 'EU AI Act',     icon: 'gavel',         color: 'euaiact'     },
  { key: 'datasets',    label: 'Datasets',      icon: 'dataset',       color: 'datasets'    },
  { key: 'aimbom',      label: 'AI-MBOM',       icon: 'receipt_long',  color: 'aimbom'      }
];

/** Build an empty per-group report map. */
function emptyByType(): Record<string, ReportFile[]> {
  return REPORT_GROUP_META.reduce((acc, m) => {
    acc[m.key] = [];
    return acc;
  }, {} as Record<string, ReportFile[]>);
}

const EMPTY_REPORTS: ReportsBucket = {
  loading: false,
  byType: emptyByType(),
  groups: []
};

/** Compute the visible groups (non-empty types in display order) for a bucket. */
function buildGroups(byType: Record<string, ReportFile[]>): (ReportGroupMeta & { items: ReportFile[] })[] {
  return REPORT_GROUP_META
    .map(meta => ({ ...meta, items: byType[meta.key] ?? [] }))
    .filter(group => group.items.length > 0);
}

@Component({
  selector: 'app-model-monitoring',
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
    MatSelectModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './model-monitoring.component.html',
  styleUrl: './model-monitoring.component.scss',
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('expanded <=> collapsed', animate('220ms cubic-bezier(0.4, 0, 0.2, 1)')),
    ])
  ]
})
export class ModelMonitoringComponent implements OnInit {

  private modelService = inject(ModelService);
  private authCtx = inject(AuthDataContextService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // ── Page configuration (overridable per route) ───────────────────────────
  pageTitle = 'Model Monitoring';
  pageSubtitle = 'Browse all models and its information registered in the system.';
  /** When true, only versions with trusted=true are surfaced. */
  trustedOnly = false;

  constructor(private spinner: NgxSpinnerService) {
    this.spinner.hide('assets');
  }

  // ── State ────────────────────────────────────────────────────────────────
  models: RegisteredModel[] = [];
  rows: ModelVersionRow[] = [];           // flattened (model × version)
  filteredRows: ModelVersionRow[] = [];

  isLoading = false;
  errorMessage = '';

  // search / filter
  searchTerm = '';
  typeFilter = '';
  availableTypes: string[] = [];

  // download progress per (uuid|version)
  downloadingKey: string | null = null;

  // ── Expand / reports state ──────────────────────────────────────────────
  /** Currently-expanded row key, or null. Single row open at a time. */
  expandedKey: string | null = null;

  /** Cached reports per row key. Avoid refetching when re-expanding the same row. */
  reportsByKey = new Map<string, ReportsBucket>();

  /** Track in-flight per-report downloads/previews. */
  busyFileKey: string | null = null;

  /** Report-group display metadata (used to build the grouped report panel). */
  readonly reportTypeMeta = REPORT_GROUP_META;

  // table columns
  displayedColumns: string[] = [
    'name', 'model_uuid', 'type', 'paradigm', 'framework',
    'owner', 'version', 'reports', 'trusted', 'actions'
  ];

  /** Second mat-row that hosts the expanded detail panel. */
  expandedDetailColumns: string[] = ['expandedDetail'];

  /**
   * Predicate for the detail row in multi-template-data-rows mode.
   * Returning true means: render the detail row for every data row.
   * (Required because MatTable allows only one matRowDef without a `when`.)
   */
  readonly isDetailRow = (_index: number, _row: ModelVersionRow) => true;

  ngOnInit(): void {
    // Allow alternate routes (e.g. /trusted-models) to override the page
    // header and toggle the trusted-only filter via route data.
    const data = this.route.snapshot.data ?? {};
    if (data['pageTitle'])    this.pageTitle    = String(data['pageTitle']);
    if (data['pageSubtitle']) this.pageSubtitle = String(data['pageSubtitle']);
    if (data['trustedOnly'])  this.trustedOnly  = Boolean(data['trustedOnly']);

    this.loadModels();
  }

  async loadModels(): Promise<void> {
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

    this.modelService.getAll(token).subscribe({
      next: (response) => {
        this.models = response?.models ?? [];
        this.availableTypes = Array.from(
          new Set(this.models.map(m => m.type).filter(Boolean))
        );
        this.rows = this.flattenModels(this.models);
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load models', err);
        this.isLoading = false;
        this.errorMessage = 'Could not load models. Please try again.';
      }
    });
  }

  /** Build one row per (model, version), keeping rows of the same model consecutive. */
  private flattenModels(models: RegisteredModel[]): ModelVersionRow[] {
    const rows: ModelVersionRow[] = [];
    for (const model of models) {
      let versions = model.versioning?.length ? model.versioning : [{ version: '—' } as ModelVersion];
      // When trustedOnly is on (Trusted Models page), drop untrusted versions
      // and skip models that have no trusted versions at all.
      if (this.trustedOnly) {
        versions = versions.filter(v => v.trusted === true);
        if (versions.length === 0) continue;
      }
      versions.forEach((version, index) => {
        rows.push({
          model,
          version,
          versionIndex: index,
          isFirstRow: index === 0,
          totalVersions: versions.length
        });
      });
    }
    return rows;
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredRows = this.rows.filter(row => {
      const m = row.model;
      const matchesType = !this.typeFilter || m.type === this.typeFilter;
      if (!term) return matchesType;
      const haystack = [
        m.name, m.model_uuid, m.owner, m.type,
        row.version.version, ...(row.version.attacks ?? []), ...(row.version.defences ?? [])
      ].join(' ').toLowerCase();
      return matchesType && haystack.includes(term);
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  onTypeChange(value: string): void {
    this.typeFilter = value;
    this.applyFilters();
  }

  refresh(): void {
    this.loadModels();
  }

  /** Copy any text to clipboard with a snackbar confirmation. */
  copy(value: string, label: string = 'Value'): void {
    if (!value) return;
    navigator.clipboard.writeText(value).then(
      () => this.snackBar.open(`${label} copied to clipboard.`, 'Close', { duration: 2000 }),
      () => this.snackBar.open(`Could not copy ${label.toLowerCase()}.`, 'Close', { duration: 2500 })
    );
  }

  /**
   * Download metadata for a specific model version as a JSON file.
   * Pulls the full payload from GET /models/{uuid} and filters to the chosen version.
   */
  async downloadMetadata(row: ModelVersionRow): Promise<void> {
    const model = row.model;
    const versionStr = row.version.version;
    const key = `${model.model_uuid}|${versionStr}`;
    this.downloadingKey = key;

    let token: string;
    try {
      token = await this.authCtx.getFreshToken();
      if (!token) throw new Error('empty token');
    } catch {
      this.downloadingKey = null;
      this.snackBar.open('Could not retrieve auth token.', 'Close', { duration: 3500 });
      return;
    }

    this.modelService.getById(model.model_uuid, token).subscribe({
      next: (response) => {
        // Some backends return { model: {...} }, others the model directly.
        const fullModel: any = (response && (response as any).model)
          ? (response as any).model
          : response;

        // Filter the payload to only include the version we clicked, while
        // preserving the rest of the model metadata.
        const matched = (fullModel?.versioning || []).find((v: any) => v?.version === versionStr);
        const payload = {
          ...fullModel,
          versioning: matched ? [matched] : []
        };

        const fileSafeName = (model.name || 'model').replace(/[^\w.-]+/g, '_');
        const fileSafeVersion = String(versionStr || 'version').replace(/[^\w.-]+/g, '_');
        const fileName = `${fileSafeName}_${model.model_uuid}_${fileSafeVersion}.json`;

        this.downloadJson(payload, fileName);
        this.downloadingKey = null;
      },
      error: (err) => {
        console.error('Download metadata failed', err);
        this.downloadingKey = null;
        this.snackBar.open('Could not download metadata.', 'Close', { duration: 3500 });
      }
    });
  }

  private downloadJson(data: unknown, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  trackByRow(_: number, row: ModelVersionRow): string {
    return `${row.model.model_uuid}|${row.version.version}`;
  }

  // ── Reports / expand panel ───────────────────────────────────────────────

  rowKey(row: ModelVersionRow): string {
    return `${row.model.model_uuid}|${row.version.version}`;
  }

  isExpanded(row: ModelVersionRow): boolean {
    return this.expandedKey === this.rowKey(row);
  }

  /** Reports bucket for a row — defaults to an empty bucket. */
  getReports(row: ModelVersionRow): ReportsBucket {
    return this.reportsByKey.get(this.rowKey(row)) ?? EMPTY_REPORTS;
  }

  /** Toggle the expand panel for a row; lazy-load reports on first open. */
  async toggleExpand(row: ModelVersionRow): Promise<void> {
    const key = this.rowKey(row);
    if (this.expandedKey === key) {
      this.expandedKey = null;
      return;
    }
    this.expandedKey = key;

    if (!this.reportsByKey.has(key)) {
      await this.loadReports(row);
    }
  }

  /** Fetch all report types for the (uuid, version) and cache the result. */
  async loadReports(row: ModelVersionRow): Promise<void> {
    const key = this.rowKey(row);

    this.reportsByKey.set(key, { loading: true, byType: emptyByType(), groups: [] });

    let token: string;
    try {
      token = await this.authCtx.getFreshToken();
      if (!token) throw new Error('empty token');
    } catch {
      this.reportsByKey.set(key, {
        loading: false, error: 'Auth token unavailable.', byType: emptyByType(), groups: []
      });
      return;
    }

    const uuid = row.model.model_uuid;
    const version = row.version.version;

    // Each per-type call is independent: if one type 404s or fails, the others
    // still surface their data. We swallow per-call errors with catchError →
    // empty list, and track failures to show an aggregate error only when
    // *every* type failed. All groups come from the per-version reports
    // endpoint: GET /models/{uuid}/versions/{version}/reports?type=...
    const failures: string[] = [];
    const safe = (meta: ReportGroupMeta) =>
      this.modelService.getReports(uuid, version, meta.key, token).pipe(
        catchError((err) => {
          console.error(`Reports load failed for ${meta.key}`, { uuid, version, err });
          failures.push(meta.key);
          return of<{ count: number; files: ReportFile[] }>({ count: 0, files: [] });
        })
      );

    // Build a { groupKey: observable } map over every report group.
    const calls = REPORT_GROUP_META.reduce((acc, meta) => {
      acc[meta.key] = safe(meta);
      return acc;
    }, {} as Record<string, ReturnType<typeof safe>>);

    forkJoin(calls).subscribe({
      next: (results) => {
        const allFailed = failures.length === REPORT_GROUP_META.length;
        const byType = emptyByType();
        for (const meta of REPORT_GROUP_META) {
          byType[meta.key] = results[meta.key]?.files ?? [];
        }
        this.reportsByKey.set(key, {
          loading: false,
          error: allFailed ? 'Could not load reports for this version.' : undefined,
          byType,
          groups: buildGroups(byType)
        });
      },
      error: (err) => {
        // forkJoin shouldn't error now that each branch has catchError, but
        // keep a defensive fallback just in case.
        console.error('Failed to load reports (forkJoin)', err);
        this.reportsByKey.set(key, {
          loading: false,
          error: 'Could not load reports for this version.',
          byType: emptyByType(),
          groups: []
        });
      }
    });
  }

  /** Manual reload for the currently-expanded row's reports. */
  refreshReports(row: ModelVersionRow): void {
    this.reportsByKey.delete(this.rowKey(row));
    this.loadReports(row);
  }

  /** Total count across all report groups — used for the expand button label. */
  totalReports(row: ModelVersionRow): number {
    const b = this.getReports(row);
    return REPORT_GROUP_META.reduce((sum, m) => sum + (b.byType[m.key]?.length ?? 0), 0);
  }

  /**
   * Memoised report groups for a row — reads from the cached bucket so
   * Angular's change detection doesn't recreate arrays on every cycle
   * (which would destroy and recreate the buttons and swallow clicks).
   */
  reportGroups(row: ModelVersionRow): (ReportGroupMeta & { items: ReportFile[] })[] {
    return this.getReports(row).groups;
  }

  /** trackBy for the *ngFor of groups — keep DOM stable across CD ticks. */
  trackByGroupKey = (_: number, g: { key: string }): string => g.key;

  /** trackBy for the *ngFor of files inside a group. */
  trackByFile = (_: number, f: ReportFile): string => this.fileKey(f);

  /** Open a preview dialog for a report file. */
  async previewReport(file: ReportFile): Promise<void> {
    const fileKey = file._id ?? file.objectKey;
    this.busyFileKey = fileKey;

    let token: string;
    try {
      token = await this.authCtx.getFreshToken();
      if (!token) throw new Error('empty token');
    } catch {
      this.busyFileKey = null;
      this.snackBar.open('Could not retrieve auth token.', 'Close', { duration: 3500 });
      return;
    }

    const id = file._id ?? file.objectKey;
    if (!id) {
      this.busyFileKey = null;
      this.snackBar.open('File is missing an id and cannot be previewed.', 'Close', { duration: 3500 });
      return;
    }

    this.modelService.downloadFileById(id, token).subscribe({
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
        console.error('Preview fetch failed', err);
        this.busyFileKey = null;
        this.snackBar.open('Could not load report for preview.', 'Close', { duration: 3500 });
      }
    });
  }

  /** Download a report file directly to disk. */
  async downloadReport(file: ReportFile): Promise<void> {
    const fileKey = file._id ?? file.objectKey;
    this.busyFileKey = fileKey;

    let token: string;
    try {
      token = await this.authCtx.getFreshToken();
      if (!token) throw new Error('empty token');
    } catch {
      this.busyFileKey = null;
      this.snackBar.open('Could not retrieve auth token.', 'Close', { duration: 3500 });
      return;
    }

    const id = file._id ?? file.objectKey;
    if (!id) {
      this.busyFileKey = null;
      this.snackBar.open('File is missing an id and cannot be downloaded.', 'Close', { duration: 3500 });
      return;
    }

    this.modelService.downloadFileById(id, token).subscribe({
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
        console.error('Report download failed', err);
        this.busyFileKey = null;
        this.snackBar.open('Could not download report.', 'Close', { duration: 3500 });
      }
    });
  }

  formatSize(bytes?: number): string {
    if (bytes === undefined || bytes === null) return '—';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  }

  /** Convenience for the template — distinct fileKey per file. */
  fileKey(file: ReportFile): string {
    return file._id ?? file.objectKey;
  }

  /** Type label for the section heading. */
  typeLabel(type: ReportType): string {
    return type === 'risk' ? 'Risk' : type === 'assessment' ? 'Assessment' : 'Defence';
  }

  // ── Upload trusted model (conditional on AIMBOM presence) ────────────────

  /**
   * True once reports for this (model, version) have been loaded AND there is
   * at least one AIMBOM file in the response. Drives the visibility of the
   * Upload Trusted Model button in the actions column.
   */
  hasAimbom(row: ModelVersionRow): boolean {
    const bucket = this.reportsByKey.get(this.rowKey(row));
    if (!bucket || bucket.loading) return false;
    return (bucket.byType?.['aimbom']?.length ?? 0) > 0;
  }

  /**
   * Open the Upload Trusted Model dialog pre-filled with the (model_uuid,
   * version) of this row. On success the reports cache is refreshed for the
   * row so the new file shows up.
   */
  openUploadTrustedModelFor(row: ModelVersionRow): void {
    const ref = this.dialog.open(UploadTrustedModelDialogComponent, {
      data: {
        modelUuid: row.model.model_uuid,
        version: row.version.version,
        modelName: row.model.name
      },
      panelClass: 'upload-trusted-model-dialog-panel',
      autoFocus: false
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) this.refreshReports(row);
    });
  }

  // ── Per-model actions ────────────────────────────────────────────────────

  /** Track per-model "create new version" requests in flight. */
  newVersionBusyUuid: string | null = null;

  /**
   * Open the New Version dialog for a model. On save it POSTs to
   * /models/{uuid}/versions and refreshes the list so the new row appears.
   */
  openNewVersionDialog(row: ModelVersionRow): void {
    const model = row.model;
    const existingVersions = (model.versioning ?? [])
      .map(v => v.version)
      .filter(Boolean);

    const ref = this.dialog.open(NewVersionDialogComponent, {
      data: {
        modelName: model.name,
        modelUuid: model.model_uuid,
        existingVersions
      },
      panelClass: 'new-version-dialog-panel',
      autoFocus: true
    });

    ref.afterClosed().subscribe(async (version: string | null) => {
      if (!version) return;
      await this.createModelVersion(model.model_uuid, version, model.name);
    });
  }

  private async createModelVersion(uuid: string, version: string, modelName: string): Promise<void> {
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
        this.snackBar.open(
          `Version ${version} created for ${modelName}.`,
          'Close',
          { duration: 3000 }
        );
        // Refresh the list so the new (model, version) row shows up.
        this.loadModels();
      },
      error: (err) => {
        console.error('Create version failed', err);
        this.newVersionBusyUuid = null;
        const message = err?.error?.message || err?.message || 'Could not create version.';
        this.snackBar.open(message, 'Close', { duration: 4000 });
      }
    });
  }

  // ── New per-version row actions ──────────────────────────────────────────

  /**
   * Navigate to the Upload Report screen with the (model_uuid, version)
   * pre-filled. The Upload Report component reads these from queryParams.
   */
  goToUploadReport(row: ModelVersionRow): void {
    this.router.navigate(['/upload-report'], {
      queryParams: {
        model_uuid: row.model.model_uuid,
        version: row.version.version
      }
    });
  }

  /** Track in-flight AIMBOM requests per (uuid|version). */
  aimbomBusyKey: string | null = null;

  /**
   * Trigger AIMBOM generation for the (model, version). This only fires the
   * request — the document is produced server-side — and shows a confirmation
   * that generation was requested. Nothing is downloaded here.
   */
  async createAimbom(row: ModelVersionRow): Promise<void> {
    const uuid = row.model.model_uuid;
    const versionStr = row.version.version;
    const key = `${uuid}|${versionStr}`;
    this.aimbomBusyKey = key;

    let token: string;
    try {
      token = await this.authCtx.getFreshToken();
      if (!token) throw new Error('empty token');
    } catch {
      this.aimbomBusyKey = null;
      this.snackBar.open('Could not retrieve auth token.', 'Close', { duration: 3500 });
      return;
    }

    this.modelService.createAimbom(uuid, versionStr, token).subscribe({
      next: (text: string) => {
        this.aimbomBusyKey = null;
        const backendMsg = this.extractMessage(text);
        const fallback = `AIMBOM generation requested for ${row.model.name} · v${versionStr}.`;
        this.snackBar.open(backendMsg || fallback, 'Close', { duration: 4500 });
      },
      error: (err) => {
        console.error('AIMBOM generation failed', err);
        this.aimbomBusyKey = null;
        // err.error can be a string (text responseType) or an object.
        const errMsg = this.extractMessage(typeof err?.error === 'string' ? err.error : '')
          || err?.error?.message
          || err?.message
          || 'AIMBOM generation request failed.';
        this.snackBar.open(errMsg, 'Close', { duration: 4500 });
      }
    });
  }

  /** Pull a human-readable message out of a backend body (JSON or text). */
  private extractMessage(body: string): string {
    if (!body) return '';
    const trimmed = body.trim();
    if (!trimmed) return '';
    try {
      const json = JSON.parse(trimmed);
      return json?.message ?? json?.detail ?? json?.error ?? trimmed;
    } catch {
      return trimmed;
    }
  }
}
