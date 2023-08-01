import { Component, OnInit } from '@angular/core';
import { NumbasService } from '../../services/numbas.service';
import { LmsService } from '../../services/Lms.service';
import jsPDF from 'jspdf';

declare global {
  interface Window { API_1484_11: any; }
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

    window.API_1484_11 =  {
      Initialize: () => this.lmsService.Initialize(),
      Terminate: () => this.lmsService.Terminate(),
      GetValue: (element: string) => this.lmsService.GetValue(element),
      SetValue: (element: string, value: string) => this.lmsService.SetValue(element, value),
      Commit: () => this.lmsService.Commit(),
      GetLastError: () => this.lmsService.GetLastError(),
      GetErrorString: (errorCode: string) => this.lmsService.GetErrorString(errorCode),
      GetDiagnostic: (errorCode: string) => this.lmsService.GetDiagnostic(errorCode)
    };
  }

  launchNumbasTest(): void {
    const iframe = document.createElement('iframe');
    iframe.src = 'http://localhost:4201/api/numbas_api/index.html';
    iframe.style.width = '100%';
    iframe.style.height = '800px';
    document.body.appendChild(iframe);
  }

  removeNumbasTest(): void {
    const iframe = document.getElementsByTagName('iframe')[0];
    iframe?.parentNode?.removeChild(iframe);
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
