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

import { ToolsService, ToolItem } from '../tools/tools.service';
import { AuthDataContextService } from '../../../guard/auth-data-context.service';
import { ConfirmDialogComponent } from '../../../shared/dialogs/confirm-dialog/confirm-dialog.component';
import { DescriptionDialogComponent } from '../../../shared/dialogs/description-dialog/description-dialog.component';
import { describeDefenceFlow } from '../../../shared/constants/defence-flows';

@Component({
  selector: 'app-gadgets',
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
  templateUrl: './gadgets.component.html',
  styleUrl: './gadgets.component.scss'
})
export class GadgetsComponent implements OnInit {

  private toolsService = inject(ToolsService);
  private authCtx = inject(AuthDataContextService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  constructor(private spinner: NgxSpinnerService) {
    this.spinner.hide('assets');
  }

  gadgets: ToolItem[] = [];
  filtered: ToolItem[] = [];

  isLoading = false;
  errorMessage = '';

  searchTerm = '';
  categoryFilter = '';
  categories: string[] = [];

  downloadingId: string | null = null;

  displayedColumns: string[] = [
    'name', 'toolName', 'description', 'attacks', 'category',
    'tags', 'defenceFlows', 'author', 'repo', 'createdAt'
  ];

  /** Filter value sent to /tools as `tool_type=`. */
  private readonly toolType = 'gadget';

  ngOnInit(): void {
    this.loadGadgets();
  }

  async loadGadgets(): Promise<void> {
    this.errorMessage = '';
    this.isLoading = true;

    let token = '';
    try { token = await this.authCtx.getFreshToken(); } catch { /* token optional */ }

    this.toolsService.list({ tool_type: this.toolType }, token).subscribe({
      next: (items) => {
        this.gadgets = items;
        this.categories = Array.from(new Set(items.map(g => g.category).filter(Boolean))).sort();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load gadgets', err);
        this.isLoading = false;
        this.errorMessage = 'Could not load gadgets. Please try again.';
      }
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = this.gadgets.filter(g => {
      const matchesCategory = !this.categoryFilter || g.category === this.categoryFilter;
      if (!term) return matchesCategory;
      const haystack = [
        g.name, g.id, g.author, g.category, g.rawCategory ?? '',
        g.description, ...(g.tags ?? []), g.repoUrl ?? '',
        ...(g.defenceFlows ?? []), g.attacksVulnerabilities ?? ''
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
    this.loadGadgets();
  }

  async download(gadget: ToolItem): Promise<void> {
    this.downloadingId = gadget.id;

    let token = '';
    try { token = await this.authCtx.getFreshToken(); } catch { /* token optional */ }

    this.toolsService.download(gadget, token).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = gadget.fileName ?? `${gadget.id}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.downloadingId = null;
      },
      error: (err) => {
        console.error('Gadget download failed', err);
        this.downloadingId = null;
        this.snackBar.open('Could not download gadget.', 'Close', { duration: 3500 });
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
        title: 'Looking for a data generator?',
        message: 'You just opened a gadget repository. Would you also like to browse the data generators catalog?',
        confirmLabel: 'Browse data generators',
        cancelLabel: 'Stay here',
        confirmIcon: 'dataset'
      },
      autoFocus: false
    });
    ref.afterClosed().subscribe(yes => {
      if (yes) this.router.navigate(['/data-generators']);
    });
  }

  showDescription(g: ToolItem): void {
    if (!g.description) return;
    this.dialog.open(DescriptionDialogComponent, {
      data: { title: g.name || g.id, subtitle: g.id, body: g.description },
      autoFocus: false
    });
  }

  showAttacks(g: ToolItem): void {
    if (!g.attacksVulnerabilities) return;
    this.dialog.open(DescriptionDialogComponent, {
      data: {
        title: 'Attacks / Vulnerabilities',
        subtitle: g.name || g.id,
        body: g.attacksVulnerabilities
      },
      autoFocus: false
    });
  }

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
