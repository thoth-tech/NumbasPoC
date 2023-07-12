import { Component, OnInit } from '@angular/core';
import { NumbasService } from '../../services/numbas.service';
import { LmsService } from '../../services/Lms.service';
import jsPDF from 'jspdf';

declare global {
  interface Window { API: any; }
}

@Component({
  selector: 'app-numbas',
  templateUrl: './numbas-component.component.html'
})
export class NumbasComponent implements OnInit {
  constructor(
    private numbasService: NumbasService,
    private lmsService: LmsService
  ) {}

  ngOnInit(): void {
    this.interceptIframeRequests();
  }

  launchNumbasTest(): void {
    const iframe = document.createElement('iframe');
    iframe.src = 'http://localhost:4200/api/numbas_api/index.html';
    iframe.style.width = '100%';
    iframe.style.height = '800px';
    document.body.appendChild(iframe);

    window.API = {
      LMSInitialize: () => { return this.lmsService.LMSInitialize(); },
      LMSFinish: () => { return this.lmsService.LMSFinish(); },
      LMSGetValue: (element: string) => { return this.lmsService.LMSGetValue(element); },
      LMSSetValue: (element: string, value: string) => { return this.lmsService.LMSSetValue(element, value); },
      LMSCommit: () => { return this.lmsService.LMSCommit(); },
      LMSGetLastError: () => { return this.lmsService.LMSGetLastError(); },
      LMSGetErrorString: (errorCode: string) => { return this.lmsService.LMSGetErrorString(errorCode); },
      LMSGetDiagnostic: (errorCode: string) => { return this.lmsService.LMSGetDiagnostic(errorCode); }
    };
  }

  interceptIframeRequests(): void {
    const originalOpen = XMLHttpRequest.prototype.open;
    const numbasService = this.numbasService;
    XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, method: string, url: string | URL, async: boolean = true, username?: string | null, password?: string | null) {
      if (typeof url === 'string' && url.startsWith('/api/numbas_api/')) {
        const resourcePath = url.replace('/api/numbas_api/', '');
        this.abort();
        numbasService.fetchResource(resourcePath).subscribe(
          (resourceData) => {
            if (this.onload) {
              this.onload.call(this, resourceData);
            }
          },
          (error) => {
            console.error('Error fetching Numbas resource:', error);
          }
        );
      } else {
        originalOpen.call(this, method, url, async, username, password);
      }
    };
  }
}
