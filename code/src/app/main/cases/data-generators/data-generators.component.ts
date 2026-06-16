import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
import { DescriptionDialogComponent } from '../../../shared/dialogs/description-dialog/description-dialog.component';

@Component({
  selector: 'app-data-generators',
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
  templateUrl: './data-generators.component.html',
  styleUrl: './data-generators.component.scss'
})
export class DataGeneratorsComponent implements OnInit {

  private toolsService = inject(ToolsService);
  private authCtx = inject(AuthDataContextService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  constructor(private spinner: NgxSpinnerService) {
    this.spinner.hide('assets');
  }

  generators: ToolItem[] = [];
  filtered: ToolItem[] = [];

  isLoading = false;
  errorMessage = '';

  searchTerm = '';
  categoryFilter = '';
  categories: string[] = [];

  downloadingId: string | null = null;

  displayedColumns: string[] = ['name', 'toolName', 'description', 'category', 'tags', 'author', 'repo', 'createdAt'];

  /** Filter value sent to /tools as `tool_type=`. */
  private readonly toolType = 'data_generator';

  ngOnInit(): void {
    this.loadGenerators();
  }

  async loadGenerators(): Promise<void> {
    this.errorMessage = '';
    this.isLoading = true;

    let token = '';
    try { token = await this.authCtx.getFreshToken(); } catch { /* token optional */ }

    this.toolsService.list({ tool_type: this.toolType }, token).subscribe({
      next: (items) => {
        this.generators = items;
        this.categories = Array.from(new Set(items.map(g => g.category).filter(Boolean))).sort();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load data generators', err);
        this.isLoading = false;
        this.errorMessage = 'Could not load data generators. Please try again.';
      }
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = this.generators.filter(g => {
      const matchesCategory = !this.categoryFilter || g.category === this.categoryFilter;
      if (!term) return matchesCategory;
      const haystack = [
        g.name, g.id, g.author, g.category, g.rawCategory ?? '',
        g.description, ...(g.tags ?? []), g.repoUrl ?? ''
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
    this.loadGenerators();
  }

  async download(generator: ToolItem): Promise<void> {
    this.downloadingId = generator.id;

    let token = '';
    try { token = await this.authCtx.getFreshToken(); } catch { /* token optional */ }

    this.toolsService.download(generator, token).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = generator.fileName ?? `${generator.id}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.downloadingId = null;
      },
      error: (err) => {
        console.error('Data generator download failed', err);
        this.downloadingId = null;
        this.snackBar.open('Could not download data generator.', 'Close', { duration: 3500 });
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

  showDescription(g: ToolItem): void {
    if (!g.description) return;
    this.dialog.open(DescriptionDialogComponent, {
      data: { title: g.name || g.id, subtitle: g.id, body: g.description },
      autoFocus: false
    });
  }
}
