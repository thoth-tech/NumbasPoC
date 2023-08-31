import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';

declare let pipwerks: any;

@Injectable({
  providedIn: 'root'
})
export class LmsService {

  private apiBaseUrl = 'http://localhost:3000/api/savetest/savetests';

  private defaultValues: { [key: string]: string } = {
    'cmi.completion_status': 'not attempted',
    'cmi.entry': 'resume',
    'cmi.objectives._count': '0',
    'cmi.interactions._count': '0',
    'numbas.user_role': 'learner',
    'numbas.duration_extension.amount': '0',
    'numbas.duration_extension.units': 'seconds',
    'cmi.mode': 'normal'
  };

  private testId: number = 0;

  initializationComplete$ = new BehaviorSubject<boolean>(false);

  private scormErrors: { [key: string]: string } = {
    "0": "No error",
    "101": "General exception",
  };

  dataStore: { [key: string]: any } = this.getDefaultDataStore();

  constructor(private http: HttpClient) {
    pipwerks.SCORM.version = "2004";
    console.log(`SCORM version is set to: ${pipwerks.SCORM.version}`);
  }

  getDefaultDataStore() {
    // Use spread operator to merge defaultValues into the dataStore
    return {
      ...this.defaultValues,
      testId: null,
      name: null,
      attempt_number: 0,
      pass_status: false,
      suspend_data: '{}',
      completed: false,
      'cmi.learner_id': null
    };
  }

  Initialize(mode: 'attempt' | 'review' = 'attempt'): string {
    console.log('Initialize() function called');

    const studentId = 123456;
    let xhr = new XMLHttpRequest();
    if (mode === 'review') {
      this.dataStore['cmi.mode'] = 'review';

      xhr.open("GET", `${this.apiBaseUrl}/completed-latest`, false);
      xhr.send();
      console.log(xhr.responseText);

      if (xhr.status !== 200) {
          console.error('Error fetching latest completed test result:', xhr.statusText);
          return 'false';
      }

      try {
          const completedTest = JSON.parse(xhr.responseText);

          // Parse suspend_data and merge it into dataStore
          const parsedSuspendData = JSON.parse(completedTest.data.suspend_data || '{}');
          this.dataStore = {
              ...this.dataStore,
              ...parsedSuspendData
          };

          this.dataStore['cmi.entry'] = 'RO';
          this.dataStore['cmi.mode'] = 'review';

          console.log('Latest completed test data:', completedTest);
          return 'true';

      } catch (error) {
          console.error('Error:', error);
          return 'false';
      }
  }
    xhr.open("GET", `${this.apiBaseUrl}/latest`, false);
    xhr.send();
    console.log(xhr.responseText);

    if (xhr.status !== 200) {
      console.error('Error fetching latest test result:', xhr.statusText);
      return 'false';
    }

    let latestTest;
    try {
        latestTest = JSON.parse(xhr.responseText);
        console.log('Latest test result:', latestTest);
        this.testId = latestTest.data.id;

        if (latestTest.data['cmi_entry'] === 'ab-initio') {
            // When starting a new test, the dataStore should use the default values
            this.dataStore = this.getDefaultDataStore();
            this.dataStore['cmi.entry'] = 'ab-initio'
        } else if (latestTest.data['cmi_entry'] === 'resume') {
            const parsedSuspendData = JSON.parse(latestTest.data.suspend_data || '{}');
            this.dataStore = {
                ...this.dataStore,
                ...parsedSuspendData
            };

            console.log(parsedSuspendData);
            this.dataStore['cmi.completion_status'] = 'incomplete';
            this.dataStore['cmi.entry'] = 'resume';
        }

        this.initializationComplete$.next(true);
        return 'true';
    } catch (error) {
        console.error('Error:', error);
        return 'false';
    }
}

  isTestCompleted(): boolean {
    return this.dataStore?.['completed'] || false;
  }

  private resetDataStore() {
    this.dataStore = this.getDefaultDataStore();
  }

  Terminate(): string {
    console.log('Terminate Called');
    const examResult = this.dataStore["cmi.score.raw"];
    const status = this.GetValue("cmi.completion_status");
    this.dataStore['completed'] = true;
    const currentAttemptNumber = this.dataStore['attempt_number'] || 0;

    const data = {
      name: 'Test Name',
      attempt_number: currentAttemptNumber,
      pass_status: status === 'passed',
      suspend_data: JSON.stringify(this.dataStore),
      completed: true,
      exam_result: examResult
    };

    const xhr = new XMLHttpRequest();
    if (this.testId) {
      xhr.open("PUT", `${this.apiBaseUrl}/${this.testId}`, false);
    } else {
      xhr.open("POST", this.apiBaseUrl, false);
    }
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(data));

    if (xhr.status !== 200) {
      console.error('Error sending test data:', xhr.statusText);
      return 'false';
    }
    this.resetDataStore();
    return 'true';
  }

  GetValue(element: string): string {
    return this.dataStore[element] || this.defaultValues[element] || '';
  }

  SetValue(element: string, value: any): string {
    if (element.startsWith('cmi.')) {
      this.dataStore[element] = value;
    }
    return 'true';
  }
//function to save the state of the exam.
Commit(): string {
  if (!this.initializationComplete$.getValue()) {
      console.warn('Initialization not complete. Cannot commit.');
      return 'false';
  }

  // Set cmi.entry to 'resume' before committing dataStore
  this.dataStore['cmi.entry'] = 'resume';

  console.log("Committing dataStore:", this.dataStore);
  const suspendDataString = JSON.stringify(this.dataStore);

  let jsonData: string;
  if (typeof suspendDataString === 'string') {
      try {
          JSON.parse(suspendDataString);
          jsonData = suspendDataString;
      } catch (e) {
          console.error('Provided string is not valid JSON:', e);
          return 'false';
      }
  } else {
      try {
          jsonData = JSON.stringify(suspendDataString);
      } catch (e) {
          console.error('Failed to stringify provided data:', e);
          return 'false';
      }
  }
    // Use XHR to send the request
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', `${this.apiBaseUrl}/${this.testId}/suspend`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 400) {
            console.log('Suspend data saved successfully.');
        } else {
            console.error('Error saving suspend data:', xhr.responseText);
        }
    };

    xhr.onerror = () => {
        console.error('Request failed.');
    };

    xhr.send(jsonData);

    return 'true';
}
  // Placeholder methods for SCORM error handling
  GetLastError(): string {
    //console.log('Get Last Error called');
    return "0";
  }

  GetErrorString(errorCode: string): string {
    return '';
  }

  GetDiagnostic(errorCode: string): string {
    //console.log('Get Diagnoistic called');
    return '';
  }
}
