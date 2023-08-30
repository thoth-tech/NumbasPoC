import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SaveTestService } from './savetest.service';
import { BehaviorSubject, Observable, throwError } from 'rxjs';

declare let pipwerks: any;

@Injectable({
  providedIn: 'root'
})
export class LmsService {
  // Default values for the dataStore
  private defaultDataStore = {
    testId: null,
    name: null,
    attempt_number: 0,
    pass_status: false,
    suspend_data: '{}',
    completed: false,
    'cmi.entry': 'ab-initio',
    'cmi.completion_status': 'not attempted',
    'cmi.learner_id': null
  };
  // Base URL for the API endpoint
  private apiBaseUrl = 'http://localhost:3000/api/savetest/savetests';
  // The main data store that holds the current state of the test
  dataStore: { [key: string]: any } = { ...this.defaultDataStore };
  private testId: number =0;
  // Observable to track if initialization is complete
  initializationComplete$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient, private saveTestService: SaveTestService) {
    // Set the SCORM version
    pipwerks.SCORM.version = "2004";
    console.log(`SCORM version is set to: ${pipwerks.SCORM.version}`);
  }

  Initialize(): string {
    console.log('Initialize() function called');

    // In Ontrack this would be set by the logged in students ID
    const studentId = 123456;

    // Fetch the latest test using synchronous XMLHttpRequest
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:3000/api/savetest/savetests/latest", false);
    xhr.send();
    console.log(xhr.responseText);

    if (xhr.status !== 200) {
      console.error('Error fetching latest test result:', xhr.statusText);
      return 'false';
    }

    // Ensure the response is valid JSON before parsing
    let latestTest;
    try {
      latestTest = JSON.parse(xhr.responseText);
      console.log('Latest test result:', latestTest);

      // Store the testId as a local variable
      this.testId = latestTest.data.id;
      // Always reset to defaults first.
      //this.resetDataStore();
      console.log(this.testId);
      console.log("Handling the test");
      console.log(latestTest.data['cmi_entry']);
      if (latestTest.data['cmi_entry'] === 'ab-initio') {
        this.dataStore['cmi.entry'] = 'ab-initio';
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
      console.log(`Handling Test ID: ${this.testId} with data:`, this.dataStore);

      this.initializationComplete$.next(true);
      return 'true';
    } catch (error) {
      console.error('Error:', error);
      return 'false';
    }
  }

  // Check if the test is completed
  isTestCompleted(): boolean {
    return this.dataStore?.['completed'] || false;
  }
  // Reset the dataStore to its default state
  private resetDataStore() {
    this.dataStore = { ...this.defaultDataStore };
  }

  Terminate(): string {
    console.log('Terminate Called');

    const examResult = this.dataStore["cmi.score.raw"];
    const status = this.GetValue("cmi.completion_status");

    // Mark the test as completed
    this.dataStore['completed'] = true;

    const currentAttemptNumber = this.dataStore['attempt_number'] || 0;

    const data = {
      name: 'Test Name',
      attempt_number: currentAttemptNumber,
      pass_status: status === 'passed',
      // Save the entire dataStore as suspend_data
      suspend_data: JSON.stringify(this.dataStore),
      completed: true,
      // Save the examResult directly in the DB
      examResult: examResult
    };

    const xhr = new XMLHttpRequest();
    if (this.testId) {
      xhr.open("PUT", `http://localhost:3000/api/savetest/savetests/${this.testId}`, false);
    } else {
      xhr.open("POST", "http://localhost:3000/api/savetest/savetests", false);
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




  // Get a value from the dataStore or return a default value
  GetValue(element: string): string {
    console.log('API.GetValue()', element);

    // Default values for specific SCORM elements
    const defaultValues: { [key: string]: string } = {
        'cmi.completion_status': 'not attempted',
        'cmi.entry': 'resume',
        'cmi.objectives._count': '0',
        'cmi.interactions._count': '0',
        'numbas.user_role': 'learner',
        'numbas.duration_extension.amount': '0',
        'numbas.duration_extension.units': 'seconds',
        'cmi.mode': 'normal'
    };

    return this.dataStore[element] || defaultValues[element] || '';
  }

  // Set a value in the dataStore
  SetValue(element: string, value: any): string {
    if (element.startsWith('cmi.')) {
      this.dataStore[element] = value;
    }
    return 'true';
  }

  private isCommitCalled = false;

 // Commit the current state of the test to the backend
 Commit(): string {
  if (!this.initializationComplete$.getValue()) {
    console.warn('Initialization not complete. Cannot commit.');
    return 'false';
  }
  const suspendDataString = JSON.stringify(this.dataStore);
  console.log(suspendDataString);
  console.log(this.testId);
  this.updateSuspendData(this.testId, suspendDataString).subscribe(
    () => {
      console.log('Suspend data saved successfully.');
    },
    (error) => {
      console.error('Error saving suspend data:', error);
    }
  );

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
  /**
   * Updates the suspend data for a specific test result.
   * @param id - The ID of the test result to update.
   * @param suspend_data - The new suspend data for the test result.
   * @returns An observable of the updated test result.
   */
  updateSuspendData(id: number, suspend_data: any): Observable<any> {
    let jsonData: string;

    if (typeof suspend_data === 'string') {
      try {
        // Try to parse it to ensure it's valid JSON
        JSON.parse(suspend_data);
        jsonData = suspend_data;
      } catch (e) {
        return throwError('Provided string is not valid JSON');
      }
    } else {
      // If it's not a string, try to stringify it
      try {
        jsonData = JSON.stringify(suspend_data);
      } catch (e) {
        return throwError('Failed to stringify provided data');
      }
    }

    return this.http.put(`${this.apiBaseUrl}/${id}/suspend`, { suspend_data: jsonData });
  }

}
