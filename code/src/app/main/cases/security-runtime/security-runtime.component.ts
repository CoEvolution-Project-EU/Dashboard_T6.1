import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-security-runtime',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './security-runtime.component.html',
  styleUrl: './security-runtime.component.scss'
})
export class SecurityRuntimeComponent {
  iframeUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(environment.srme);
  }
}
