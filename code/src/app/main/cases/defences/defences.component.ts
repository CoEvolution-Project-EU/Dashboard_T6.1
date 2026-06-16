import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

import { ToolsService, ToolItem } from '../tools/tools.service';
import { AuthDataContextService } from '../../../guard/auth-data-context.service';
import { ConfirmDialogComponent } from '../../../shared/dialogs/confirm-dialog/confirm-dialog.component';
import { DescriptionDialogComponent } from '../../../shared/dialogs/description-dialog/description-dialog.component';
import { describeDefenceFlow } from '../../../shared/constants/defence-flows';

@Component({
  selector: 'app-defences',
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
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './defences.component.html',
  styleUrl: './defences.component.scss'
})
export class DefencesComponent implements OnInit {

  private toolsService = inject(ToolsService);
  private authCtx = inject(AuthDataContextService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  constructor(private spinner: NgxSpinnerService) {
    this.spinner.hide('assets');
  }

  defences: ToolItem[] = [];
  filtered: ToolItem[] = [];

  isLoading = false;
  errorMessage = '';

  searchTerm = '';
  categoryFilter = '';
  categories: string[] = [];

  downloadingId: string | null = null;

  /** Tools-page-style columns; "Type" is filtered server-side to `defence`. */
  displayedColumns: string[] = [
    'name', 'toolName', 'description', 'attacks', 'category',
    'tags', 'defenceFlows', 'author', 'repo'
  ];

  /** Filter value sent to /tools as `tool_type=`. */
  private readonly toolType = 'defence';

  ngOnInit(): void {
    this.loadDefences();
  }

  async loadDefences(): Promise<void> {
    this.errorMessage = '';
    this.isLoading = true;

    let token = '';
    try { token = await this.authCtx.getFreshToken(); } catch { /* placeholder ok */ }

    this.toolsService.list({ tool_type: this.toolType }, token).subscribe({
      next: (defences) => {
        this.defences = defences;
        this.categories = Array.from(new Set(defences.map(d => d.category).filter(Boolean))).sort();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load defences', err);
        this.isLoading = false;
        this.errorMessage = 'Could not load defences. Please try again.';
      }
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = this.defences.filter(d => {
      const matchesCategory = !this.categoryFilter || d.category === this.categoryFilter;
      if (!term) return matchesCategory;
      const haystack = [
        d.name, d.id, d.author, d.category, d.rawCategory ?? '',
        d.description, ...(d.tags ?? []), d.repoUrl ?? '',
        ...(d.defenceFlows ?? []), d.attacksVulnerabilities ?? ''
      ].join(' ').toLowerCase();
      return matchesCategory && haystack.includes(term);
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  onCategoryChange(value: string): void {
    this.categoryFilter = value;
    this.applyFilters();
  }

  refresh(): void {
    this.loadDefences();
  }

  async download(defence: ToolItem): Promise<void> {
    this.downloadingId = defence.id;

    let token = '';
    try { token = await this.authCtx.getFreshToken(); } catch { /* token optional */ }

    this.toolsService.download(defence, token).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defence.fileName ?? `${defence.id}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.downloadingId = null;
      },
      error: (err) => {
        console.error('Defence download failed', err);
        this.downloadingId = null;
        this.snackBar.open('Could not download defence.', 'Close', { duration: 3500 });
      }
    });
  }

  trackById(_: number, item: ToolItem): string {
    return item.id;
  }

  copy(value: string, label: string = 'Value'): void {
    if (!value) return;
    navigator.clipboard.writeText(value).then(
      () => this.snackBar.open(`${label} copied to clipboard.`, 'Close', { duration: 2000 }),
      () => this.snackBar.open(`Could not copy ${label.toLowerCase()}.`, 'Close', { duration: 2500 })
    );
  }

  /** Friendly label for a repo URL — mirrors ToolsComponent. */
  repoLabel(url: string | undefined): string {
    if (!url) return '';
    try {
      const u = new URL(url);
      const path = u.pathname.replace(/^\/+|\/+$/g, '');
      if (/^github\.com$/i.test(u.host) && path) {
        const parts = path.split('/').filter(Boolean);
        if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
      }
      return path ? `${u.host}/${path}` : u.host;
    } catch {
      return url;
    }
  }

  repoIcon(url: string | undefined): string {
    if (!url) return 'link';
    if (/github\.com/i.test(url)) return 'code';
    if (/gitlab\./i.test(url)) return 'fork_right';
    return 'link';
  }

  onRepoClick(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Looking for a Data Generator?',
        message: 'You just opened a Defence repository. Would you also like to browse the Data Generators Catalog?',
        confirmLabel: 'Browse Data Generators',
        cancelLabel: 'Close',
        confirmIcon: 'dataset'
      },
      autoFocus: false
    });
    ref.afterClosed().subscribe(yes => {
      if (yes) this.router.navigate(['/data-generators']);
    });
  }

  showDescription(d: ToolItem): void {
    if (!d.description) return;
    this.dialog.open(DescriptionDialogComponent, {
      data: { title: d.name || d.id, subtitle: d.id, body: d.description },
      autoFocus: false
    });
  }

  showAttacks(d: ToolItem): void {
    if (!d.attacksVulnerabilities) return;
    this.dialog.open(DescriptionDialogComponent, {
      data: {
        title: 'Attacks / Vulnerabilities',
        subtitle: d.name || d.id,
        body: d.attacksVulnerabilities
      },
      autoFocus: false
    });
  }

  /** Open a popup explaining a Defence Flow (DF-xx) identifier. */
  showDefenceFlow(flowId: string): void {
    if (!flowId) return;
    this.dialog.open(DescriptionDialogComponent, {
      data: {
        title: 'Defence Flow ' + flowId,
        subtitle: 'Defence flow description',
        body: describeDefenceFlow(flowId)
      },
      autoFocus: false
    });
  }
}
