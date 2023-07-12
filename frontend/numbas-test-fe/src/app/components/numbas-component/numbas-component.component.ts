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
  dataStore: { [key: string]: string } = {};

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
      LMSInitialize: () => { console.log('API.init()'); return "true"; },
      LMSFinish: () => {
        console.log('API.LMSFinish()');
        let examResult = {...this.dataStore};

        // Create a Blob from the JSON data
        const examResultBlob = new Blob([JSON.stringify(examResult, null, 2)], {type: 'application/json'});

        // Create a URL for the Blob
        const blobURL = window.URL.createObjectURL(examResultBlob);

        // Create a link element
        const tempLink = document.createElement('a');

        // Set the link's href to the Blob URL
        tempLink.href = blobURL;

        // Set the download attribute of the link to the desired file name
        tempLink.download = 'examResult.json';

        // Append the link to the body
        document.body.appendChild(tempLink);

        // Programmatically click the link
        tempLink.click();

        // Remove the link from the body
        document.body.removeChild(tempLink);

        return "true";
      },
      LMSGetValue: (element: string) => { 
        console.log('API.LMSGetValue()', element);
        let result = "";
        switch (element) {
          case 'cmi.core.lesson_status':
            result = 'not attempted'; 
            break;
          case 'cmi.entry':
            result = 'ab-initio'; 
            break;
          case 'cmi.objectives._count':
          case 'cmi.interactions._count':
            result = '0';
            break;
          case 'numbas.user_role':
            result = 'learner'; 
            break;
          case 'numbas.duration_extension.amount':
            result = '0';
            break;
          case 'numbas.duration_extension.units':
            result = 'seconds'; 
            break;
          case 'cmi.mode':
            result = 'normal';
            break;
          default:
            result = this.dataStore[element] || "";
        }
        return result;
      },
      LMSSetValue: (element: string, value: string) => { 
        console.log('API.LMSSetValue()', element, value);
        this.dataStore[element] = value;
        return "true"; 
      },
      LMSCommit: () => { console.log('API.LMSCommit()'); return "true"; },
      LMSGetLastError: () => { console.log('API.LMSGetLastError()'); return "0"; },
      LMSGetErrorString: (errorCode: string) => { 
        console.log('API.LMSGetErrorString()', errorCode);
        return "";
      },
      LMSGetDiagnostic: (errorCode: string) => { 
        console.log('API.LMSGetDiagnostic()', errorCode);
        return "";
      }
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
