import { Component, OnInit } from '@angular/core';
import { NumbasService } from '../../services/numbas.service';

declare global {
  interface Window { API: any; }
}

@Component({
  selector: 'app-numbas',
  templateUrl: './numbas-component.component.html'
})
export class NumbasComponent implements OnInit {
  constructor(private numbasService: NumbasService) {}

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
      LMSInitialize: () => { console.log('API.init()'); return true; },
      LMSGetLastError: () => { console.log('API.LMSGetLastError()'); return 0; },
      LMSGetErrorString: (errorCode: string) => { console.log('API.LMSGetErrorString()', errorCode); return errorCode; },
      LMSGetValue: (element: string) => { console.log('API.LMSGetValue()', element); return ""; },
    }
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
