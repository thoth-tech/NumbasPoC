import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

@Injectable({
  providedIn: 'root'
})
export class LmsService {
  dataStore: { [key: string]: any } = {}; // Change the type to 'any'

  LMSInitialize(): string {
    console.log('API.init()');
    return 'true';
  }

  LMSFinish(): string {
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
  }

  LMSGetValue(element: string): string {
    console.log('API.LMSGetValue()', element);
    let result = '';
    switch (element) {
      case 'cmi.core.lesson_status':
        result = this.dataStore[element] || 'not attempted';
        break;
      case 'cmi.entry':
        result = this.dataStore[element] || 'ab-initio';
        break;
      case 'cmi.objectives._count':
      case 'cmi.interactions._count':
        result = this.dataStore[element] || '0';
        break;
      case 'numbas.user_role':
        result = this.dataStore[element] || 'learner';
        break;
      case 'numbas.duration_extension.amount':
        result = this.dataStore[element] || '0';
        break;
      case 'numbas.duration_extension.units':
        result = this.dataStore[element] || 'seconds';
        break;
      case 'cmi.mode':
        result = this.dataStore[element] || 'normal';
        break;
      default:
        result = this.dataStore[element] || '';
    }
    return result;
  }

  LMSSetValue(element: string, value: string): string {
    console.log('API.LMSSetValue()', element, value);
    if (element.startsWith('cmi.')) {
      this.dataStore[element] = value;
    }
    return 'true';
  }

  LMSCommit(): string {
    console.log('API.LMSCommit()');
    return 'true';
  }

  LMSGetLastError(): string {
    return '0';
  }

  LMSGetErrorString(errorCode: string): string {
    console.log('API.LMSGetErrorString()', errorCode);
    return '';
  }

  LMSGetDiagnostic(errorCode: string): string {
    console.log('API.LMSGetDiagnostic()', errorCode);
    return '';
  }
}
