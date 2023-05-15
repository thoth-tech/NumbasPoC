import { Injectable } from '@angular/core';
import { ScormAPIImplementation } from './scorm-api-implementation';

@Injectable({
  providedIn: 'root',
})
export class ScormService {
  private initialized = false;
  private scormAPI: ScormAPIImplementation | null = null;

  public init(contentWindow?: Window | null): boolean {
    if (contentWindow) {
      this.scormAPI = new ScormAPIImplementation(contentWindow);
    }
    if (this.scormAPI) {
      const result = this.scormAPI.LMSInitialize('');
      this.initialized = result === 'true';
      return this.initialized;
    } else {
      console.error('SCORM API not found');
      return false;
    }
  }
  

  // Terminates the SCORM API connection and returns whether it was successful
  public quit(): boolean {
    if (this.scormAPI && this.initialized) {
      // Calls LMSFinish() method of the ScormAPIImplementation service
      const result = this.scormAPI.LMSFinish('');
      // Sets initialized flag to false and returns true if LMSFinish() returned 'true'
      this.initialized = false;
      return result === 'true';
    } else {
      return false;
    }
  }

  public set(parameter: string, value: string): boolean {
    if (this.scormAPI && this.initialized) {
      const result = this.scormAPI.LMSSetValue(parameter, value);
  
      // Save the test results locally
      this.saveTestResultsLocally('test-results.txt', value);
  
      return result === 'true';
    } else {
      return false;
    }
  }

  // Gets a SCORM parameter value
  public get(parameter: string): string {
    if (this.scormAPI && this.initialized) {
      // Calls LMSGetValue() method of the ScormAPIImplementation service
      return this.scormAPI.LMSGetValue(parameter);
    } else {
      return '';
    }
  }
  public getScormAPI(): ScormAPIImplementation | null {
    return this.scormAPI;
  }

  // Save the test results locally to the assets folder
  public saveTestResultsLocally(filename: string, content: string): void {
    const filePath = `assets/${filename}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filePath;
    link.click();

    URL.revokeObjectURL(url);
  }
  
}