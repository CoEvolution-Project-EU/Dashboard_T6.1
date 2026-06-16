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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

import { ToolsService, ToolItem } from './tools.service';
import { AuthDataContextService } from '../../../guard/auth-data-context.service';
import { ConfirmDialogComponent } from '../../../shared/dialogs/confirm-dialog/confirm-dialog.component';
import { DescriptionDialogComponent } from '../../../shared/dialogs/description-dialog/description-dialog.component';
import { describeDefenceFlow } from '../../../shared/constants/defence-flows';

@Component({
  selector: 'app-tools',
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
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './tools.component.html',
  styleUrl: './tools.component.scss'
})
export class ToolsComponent implements OnInit {

  private toolsService = inject(ToolsService);
  private authCtx = inject(AuthDataContextService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  constructor(private spinner: NgxSpinnerService) {
    this.spinner.hide('assets');
  }

  tools: ToolItem[] = [];
  filtered: ToolItem[] = [];

  isLoading = false;
  errorMessage = '';

  searchTerm = '';
  categoryFilter = '';
  categories: string[] = [];

  downloadingId: string | null = null;

  displayedColumns: string[] = [
    'name', 'toolName', 'description', 'attacks', 'category',
    'tags', 'defenceFlows', 'author', 'repo'
  ];

  /** Filter value sent to /tools as `tool_type=`. The Tools page is the
   *  assessment catalog; defences and data generators get their own pages. */
  private readonly toolType = 'assessment';

  /** Friendly label for a repo URL — falls back to the URL host if unknown. */
  repoLabel(url: string | undefined): string {
    if (!url) return '';
    try {
      const u = new URL(url);
      const path = u.pathname.replace(/^\/+|\/+$/g, '');
      // GitHub-style "org/repo" shows nicely; for everything else show host.
      if (/^github\.com$/i.test(u.host) && path) {
        const parts = path.split('/').filter(Boolean);
        if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
      }
      return path ? `${u.host}/${path}` : u.host;
    } catch {
      return url;
    }
  }

  /** Choose an icon based on the URL host. */
  repoIcon(url: string | undefined): string {
    if (!url) return 'link';
    if (/github\.com/i.test(url)) return 'code';
    if (/gitlab\./i.test(url)) return 'fork_right';
    return 'link';
  }

  /**
   * Triggered when the user clicks a repository link. The link still opens
   * in a new tab (default anchor behaviour); we additionally pop up a
   * suggestion to browse data generators.
   */
  onRepoClick(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Looking for a Data Generator?',
        message: 'You just opened a Tool repository. Would you also like to browse the Data Generators catalog?',
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

  /** Open a popup with the full description text of a tool. */
  showDescription(t: ToolItem): void {
    if (!t.description) return;
    this.dialog.open(DescriptionDialogComponent, {
      data: {
        title: t.name || t.id,
        subtitle: t.id,
        body: t.description
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

  /** Open a popup with the full Attacks / Vulnerabilities text. */
  showAttacks(t: ToolItem): void {
    if (!t.attacksVulnerabilities) return;
    this.dialog.open(DescriptionDialogComponent, {
      data: {
        title: 'Attacks / Vulnerabilities',
        subtitle: t.name || t.id,
        body: t.attacksVulnerabilities
      },
      autoFocus: false
    });
  }

  ngOnInit(): void {
    this.loadTools();
  }

  async loadTools(): Promise<void> {
    this.errorMessage = '';
    this.isLoading = true;

    // Token wiring is in place for when the real endpoint exists.
    let token = '';
    try { token = await this.authCtx.getFreshToken(); } catch { /* placeholder ok */ }

    this.toolsService.list({ tool_type: this.toolType }, token).subscribe({
      next: (tools) => {
        this.tools = tools;
        // Build category options from the humanised display label, sorted.
        this.categories = Array.from(new Set(tools.map(t => t.category).filter(Boolean))).sort();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load tools', err);
        this.isLoading = false;
        this.errorMessage = 'Could not load tools. Please try again.';
      }
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = this.tools.filter(t => {
      const matchesCategory = !this.categoryFilter || t.category === this.categoryFilter;
      if (!term) return matchesCategory;
      const haystack = [
        t.name, t.id, t.author, t.category, t.rawCategory ?? '',
        t.description, ...(t.tags ?? []), t.repoUrl ?? '',
        ...(t.defenceFlows ?? []), t.attacksVulnerabilities ?? ''
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
    this.loadTools();
  }

  async download(tool: ToolItem): Promise<void> {
    this.downloadingId = tool.id;

    let token = '';
    try { token = await this.authCtx.getFreshToken(); } catch { /* placeholder ok */ }

    this.toolsService.download(tool, token).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = tool.fileName ?? `${tool.id}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.downloadingId = null;
      },
      error: (err) => {
        console.error('Tool download failed', err);
        this.downloadingId = null;
        this.snackBar.open('Could not download tool.', 'Close', { duration: 3500 });
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
}
