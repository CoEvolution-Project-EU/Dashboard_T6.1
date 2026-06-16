import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface ToolItem {
  id: string;                 // tool_id ("TOOL-003")
  name: string;               // display name — falls back to id
  category: string;           // tool_type, humanised
  rawCategory?: string;       // tool_type, untouched (used for filtering)
  version: string;            // pulled from tags ("v1") when present
  description: string;
  author?: string;            // uploadedBy
  size?: string;
  fileName?: string;
  createdAt?: string;
  repoUrl?: string;           // github_url
  homepage?: string;
  tags?: string[];
  defenceFlows?: string[];          // defence_flows from the response
  attacksVulnerabilities?: string;  // free-text describing covered attacks / vulnerabilities
}

/** Loose shape of whatever the orchestrator returns from GET /tools. */
type ToolApiItem = Partial<ToolItem> & {
  _id?: string;
  tool_uuid?: string;
  toolId?: string;
  tool_id?: string;
  title?: string;
  type?: string;
  tool_type?: string;
  category?: string;
  description?: string;
  owner?: string;
  uploadedBy?: string;
  size?: number | string;
  filename?: string;
  fileName?: string;
  createdAt?: string;
  created_at?: string;
  updated_at?: string;
  version?: string;
  tags?: string[];
  // possible repo URL fields the backend might use
  repoUrl?: string;
  repo?: string;
  repository?: string;
  repository_url?: string;
  repositoryUrl?: string;
  githubUrl?: string;
  github_url?: string;
  github?: string;
  url?: string;
  homepage?: string;
  defence_flows?: string[];
  defenceFlows?: string[];
  attacks_vulnerabilities?: string;
  attacksVulnerabilities?: string;
  'Attacks/Vulnerabilities'?: string;
};

@Injectable({ providedIn: 'root' })
export class ToolsService {
  private http = inject(HttpClient);
  private API = environment.apiUrl;

  /**
   * List the available tools catalog from the orchestrator.
   *
   * GET {API}/tools — accepts a `tool_type` query filter, so the same
   * endpoint can back the Tools / Defences / Data Generators pages.
   * Accepted response shapes: `{ tools: [...] }`, `{ items: [...] }`,
   * or a raw array; each entry is normalised into a flat ToolItem.
   */
  list(
    optionsOrToken?: { tool_type?: string } | string,
    maybeToken?: string
  ): Observable<ToolItem[]> {
    // Backwards-compatible call style: `list(token)` still works.
    const options: { tool_type?: string } =
      typeof optionsOrToken === 'string' || optionsOrToken === undefined
        ? {}
        : optionsOrToken;
    const token =
      typeof optionsOrToken === 'string' ? optionsOrToken : maybeToken;

    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    let params = new HttpParams();
    if (options.tool_type) params = params.set('tool_type', options.tool_type);

    return this.http.get<any>(`${this.API}/tools`, { headers, params }).pipe(
      map(response => this.extractTools(response)),
      map(items => items.map(item => this.normalizeTool(item))
    )
    );
  }

  /**
   * Download a tool's binary.
   *
   * Tries GET {API}/tools/{id}/download first (most consistent with the rest
   * of the orchestrator); if the server doesn't expose that path it can be
   * pointed at /files/download/{id} or similar from a single place here.
   */
  download(tool: ToolItem, token?: string): Observable<Blob> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.http.get(`${this.API}/tools/${encodeURIComponent(tool.id)}/download`, {
      headers,
      responseType: 'blob'
    }).pipe(
      catchError(err => {
        console.error('Tool download failed', err);
        throw err;
      })
    );
  }

  // ── Response normalisation ──────────────────────────────────────────────

  private extractTools(response: any): ToolApiItem[] {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.tools)) return response.tools;
    if (Array.isArray(response.items)) return response.items;
    if (Array.isArray(response.data)) return response.data;
    return [];
  }

  private normalizeTool(raw: ToolApiItem): ToolItem {
    // tool_id (eg "TOOL-003") is the user-visible identifier; _id is mongo's
    // internal key and we don't want to surface it.
    const id = String(
      raw.tool_id
      ?? raw.id
      ?? raw.toolId
      ?? raw.tool_uuid
      ?? raw._id
      ?? ''
    );

    const size = typeof raw.size === 'number'
      ? this.humanSize(raw.size)
      : (raw.size ?? undefined);

    // tool_type is the canonical category (eg "assessment_with_defence");
    // keep the raw value for filtering, humanise it for display.
    const rawCategory = raw.tool_type ?? raw.type ?? raw.category ?? '';
    const category = rawCategory ? this.humaniseSnake(rawCategory) : '—';

    const tags = Array.isArray(raw.tags) ? raw.tags : undefined;
    // If the backend doesn't ship a version field, surface the first tag
    // that looks like "v1" / "v2.1" — keeps the column populated.
    const versionFromTag = tags?.find(t => /^v?\d+(\.\d+)*$/i.test(String(t)));
    const version = raw.version ?? versionFromTag ?? '—';

    const repoUrl = this.firstUrl([
      raw.github_url,
      raw.githubUrl,
      raw.github,
      raw.repoUrl,
      raw.repo,
      raw.repository,
      raw.repository_url,
      raw.repositoryUrl,
      raw.url
    ]);

    return {
      id,
      name: raw.name ?? raw.title ?? id,
      category,
      rawCategory: rawCategory || undefined,
      version,
      description: raw.description ?? '',
      author: raw.uploadedBy ?? raw.author ?? raw.owner,
      size,
      fileName: raw.fileName ?? raw.filename,
      createdAt: raw.createdAt ?? raw.created_at,
      repoUrl,
      homepage: raw.homepage,
      tags,
      defenceFlows: Array.isArray(raw.defence_flows) ? raw.defence_flows
                  : Array.isArray(raw.defenceFlows) ? raw.defenceFlows
                  : undefined,
      attacksVulnerabilities:
        raw.attacks_vulnerabilities
        ?? raw.attacksVulnerabilities
        ?? raw['Attacks/Vulnerabilities']
        ?? undefined
    };
  }

  /** "assessment_with_defence" → "Assessment with Defence". */
  private humaniseSnake(value: string): string {
    return String(value)
      .replace(/[_-]+/g, ' ')
      .trim()
      .split(/\s+/)
      .map((w, i) => {
        const lower = w.toLowerCase();
        // keep short connector words lowercase except at the start.
        if (i > 0 && /^(with|and|or|of|the|for|to|in|on)$/i.test(lower)) return lower;
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(' ');
  }

  /** Return the first valid http(s) URL from the candidate list. */
  private firstUrl(candidates: Array<string | undefined | null>): string | undefined {
    for (const c of candidates) {
      if (typeof c === 'string' && /^https?:\/\//i.test(c.trim())) {
        return c.trim();
      }
    }
    return undefined;
  }

  private humanSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  }
}
