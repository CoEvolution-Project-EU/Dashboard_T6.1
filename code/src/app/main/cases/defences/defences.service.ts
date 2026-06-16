import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http'; // re-enable when /defences endpoint exists
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DefenceItem {
  id: string;            // e.g. DEF-001
  name: string;
  category: string;      // e.g. Adversarial, Privacy, Robustness
  version: string;
  description: string;
  threats?: string[];    // attack ids this defence covers (e.g. ATK-001)
  author?: string;
  size?: string;
  fileName?: string;
}

@Injectable({ providedIn: 'root' })
export class DefencesService {
  // private http = inject(HttpClient); // re-enable when /defences endpoint exists
  private API = environment.apiUrl;

  // ── Placeholder data — swap to live endpoint when ready ─────────────────
  private readonly placeholderDefences: DefenceItem[] = [
    {
      id: 'DEF-001',
      name: 'Adversarial Training',
      category: 'Adversarial',
      version: 'v1.2.0',
      description: 'Augments training data with adversarial examples to harden the model.',
      threats: ['ATK-001', 'ATK-002'],
      author: 'CoEvolution',
      size: '5.4 MB',
      fileName: 'defence-adversarial-training-v1.2.0.zip',
    },
    {
      id: 'DEF-002',
      name: 'Differential Privacy Wrapper',
      category: 'Privacy',
      version: 'v0.8.0',
      description: 'Adds calibrated noise to gradients to protect training data.',
      threats: ['ATK-010'],
      author: 'CoEvolution',
      size: '3.8 MB',
      fileName: 'defence-dp-wrapper-v0.8.0.zip',
    },
    {
      id: 'DEF-003',
      name: 'Input Sanitizer',
      category: 'Robustness',
      version: 'v2.0.1',
      description: 'Detects and rejects out-of-distribution and malformed inputs.',
      threats: ['ATK-003', 'ATK-007'],
      author: 'CoEvolution',
      size: '1.7 MB',
      fileName: 'defence-input-sanitizer-v2.0.1.zip',
    },
    {
      id: 'DEF-004',
      name: 'Membership Inference Shield',
      category: 'Privacy',
      version: 'v0.4.2',
      description: 'Reduces susceptibility to membership inference attacks.',
      threats: ['ATK-011'],
      author: 'CoEvolution',
      size: '2.1 MB',
      fileName: 'defence-mi-shield-v0.4.2.zip',
    }
  ];

  /**
   * List available defences.
   * TODO: replace with `this.http.get<DefenceItem[]>(`${this.API}/defences`, ...)`
   * once the orchestrator endpoint is available.
   */
  list(_token?: string): Observable<DefenceItem[]> {
    return of(this.placeholderDefences).pipe(delay(300));
  }

  /**
   * Download a defence by id.
   * TODO: switch to `this.http.get(`${this.API}/defences/${id}/download`,
   *   { headers, responseType: 'blob' })` when the endpoint exists.
   */
  download(defence: DefenceItem, _token?: string): Observable<Blob> {
    const placeholder = this.buildPlaceholderArchive(defence);
    return of(placeholder).pipe(delay(600));
  }

  private buildPlaceholderArchive(defence: DefenceItem): Blob {
    const body =
`# ${defence.name} (${defence.version})

This is a placeholder file. The Defences download endpoint is not yet wired
into the orchestrator. When it is, this method will return the real binary
from GET ${this.API}/defences/${defence.id}/download.

Defence ID: ${defence.id}
Category: ${defence.category}
Threats covered: ${(defence.threats ?? []).join(', ') || '—'}
Author: ${defence.author ?? 'Unknown'}
`;
    return new Blob([body], { type: 'application/octet-stream' });
  }
}
