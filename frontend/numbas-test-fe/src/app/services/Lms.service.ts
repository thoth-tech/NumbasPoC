import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';

declare let pipwerks: any;

@Injectable({
  providedIn: 'root'
})
export class LmsService {

  private apiBaseUrl = 'http://localhost:3000/api/savetest/savetests';

  // private defaultValues: { [key: string]: string } = {
  //   'cmi.completion_status': 'not attempted',
  //   'cmi.entry': 'resume',
  //   'cmi.objectives._count': '0',
  //   'cmi.interactions._count': '0',
  //   'numbas.user_role': 'learner',
  //   'numbas.duration_extension.amount': '0',
  //   'numbas.duration_extension.units': 'seconds',
  //   'cmi.mode': 'normal'
  // };

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
      // ...this.defaultValues,
      testId: null,
      name: null,
      attempt_number: 0,
      pass_status: false,
      completed: false,
    };
  }

  Initialize(mode: 'attempt' | 'review' = 'attempt'): string {
    console.log('Initialize() function called');

    const studentId = 123456;
    let xhr = new XMLHttpRequest();
    if (mode === 'review') {
      this.SetValue('cmi.mode', 'review');

      xhr.open("GET", `${this.apiBaseUrl}/completed-latest`, false);
      xhr.send();
      console.log(xhr.responseText);

      if (xhr.status !== 200) {
          console.error('Error fetching latest completed test result:', xhr.statusText);
          return 'false';
      }

      try {
          const completedTest = JSON.parse(xhr.responseText);
          const parsedSuspendData = JSON.parse(completedTest.data.suspend_data || '{}');

          // Set entire suspendData string to cmi.suspend_data
          this.SetValue('cmi.suspend_data', JSON.stringify(parsedSuspendData));

          // Use SetValue to set parsedSuspendData values to dataStore
          Object.keys(parsedSuspendData).forEach(key => {
            this.SetValue(key, parsedSuspendData[key]);
          });

          this.SetValue('cmi.entry', 'RO');
          this.SetValue('cmi.mode', 'review');

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
          console.log("starting new test");
            this.dataStore = this.getDefaultDataStore();
            this.SetValue('cmi.entry', 'ab-initio');
            this.SetValue('cmi.learner_id', studentId);
            console.log(this.dataStore);
      } else if (latestTest.data['cmi_entry'] === 'resume') {
            console.log("resuming test");
            const parsedSuspendData = JSON.parse(latestTest.data.suspend_data || '{}');

            this.dataStore = JSON.parse(JSON.stringify(parsedSuspendData));

            console.log(this.dataStore);



            // Set the suspend_data value as the value for cmi.suspend_data in your datastore
            //this.SetValue('cmi.suspend_data', latestTest.data.suspend_data || '{}');
            //this.SetValue('cmi.entry', 'resume');
            // Setting cmi.location if available in suspend_data
            // if (parsedSuspendData['cmi.location']) {
            //   this.SetValue('cmi.location', parsedSuspendData['cmi.location']);
            // }
            // this.SetValue('cmi.entry', 'resume');
            // this.SetValue('cmi.completion_status', 'incomplete');
            // // Set entire suspendData string to cmi.suspend_data
            // this.SetValue('cmi.suspend_data', JSON.stringify(parsedSuspendData));

            // // Use SetValue to set parsedSuspendData values to dataStore
            // Object.keys(parsedSuspendData).forEach(key => {
            //   this.SetValue(key, parsedSuspendData[key]);
            // });
            // console.log(this.dataStore);
        }

        this.initializationComplete$.next(true);
        console.log("finished initlizing");
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
    return this.dataStore[element] || '';
  }

  SetValue(element: string, value: any): string {
    if (element.startsWith('cmi.')) {
      this.dataStore[element] = value;
    }
    console.log("set value called");
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
  if (!this.isTestCompleted()) {
    this.dataStore['cmi.exit'] = 'suspend';
  }
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
