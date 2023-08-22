import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SaveTestService } from './savetest.service';
import { BehaviorSubject } from 'rxjs';

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

  // The main data store that holds the current state of the test
  dataStore: { [key: string]: any } = { ...this.defaultDataStore };

  // Observable to track if initialization is complete
  initializationComplete$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient, private saveTestService: SaveTestService) {
    // Set the SCORM version
    pipwerks.SCORM.version = "2004";
    console.log(`SCORM version is set to: ${pipwerks.SCORM.version}`);
  }

  Initialize(): string {
    console.log('Initialize() function called');
    const studentId = 123456;
    this.dataStore['cmi.learner_id'] = studentId;

    const latestTest = this.getLatestTestResult();

    if (latestTest) {
      if (latestTest.completed === false) {
        this.resumeExistingTest(latestTest);
      } else {
        this.createNewTest(latestTest.attempt_number + 1, 'completed');
      }
    } else {
      this.createNewTest(0, 'not attempted');
    }
    this.initializationComplete$.next(true);
    return 'true';
  }

  private getLatestTestResult(): any {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:3000/api/savetests/latest.txt", false);
    xhr.send();

    if (xhr.status !== 200) {
      console.error('Error fetching latest test result:', xhr.statusText);
      return null;
    }

    return JSON.parse(xhr.responseText);
  }

// Create a new test
private createNewTest(attemptNumber: number, completionStatus: string) {
  console.log('Create New Test Called');

  // Reset the dataStore to default values
  this.resetDataStore();

  // Set the completion status
  this.dataStore['cmi.completion_status'] = completionStatus;

  // Define the details for the new test
  const newTestDetails = {
    //Name can be pulled from TaskDef in main system
    name: 'PlaceholderTestName',
    attempt_number: attemptNumber,
    pass_status: false,
    suspend_data: '{}',
    completed: false
  };

  // Save the new test to the backend
  this.saveTestService.createTestResult(newTestDetails).subscribe(newTest => {
    this.dataStore['testId'] = newTest.id;
  }, error => {
    console.error('Error creating a new test:', error);
  });
}

  // Reset the dataStore to its default state
  private resetDataStore() {
    this.dataStore = { ...this.defaultDataStore };
  }

  // Resume an existing test
  private resumeExistingTest(latestTest: any) {
    console.log("Resuming old test");
    try {
      // Parse the suspend data from the latest test
      const parsedSuspendData = JSON.parse(latestTest.suspend_data || '{}');

      // Reset the dataStore to its default state
      this.resetDataStore();

      // Update the dataStore with the parsed suspend data and other details from the latest test
      this.dataStore = {
        ...this.dataStore, // Start with the current default values
        ...parsedSuspendData, // Overwrite with the parsed suspend data
        testId: latestTest.id,
        'cmi.entry': 'resume',
        'cmi.completion_status': 'incomplete'
      };
      console.log(`Resuming Test ID: ${latestTest.id} with data:`, this.dataStore);
    } catch (error) {
      console.error('Error parsing suspend_data:', error);
    }
  }

  // Get the current test ID
  getCurrentTestId(): string {
    return this.dataStore?.['testId'];
  }

  // Check if the test is completed
  isTestCompleted(): boolean {
    return this.dataStore?.['completed'] || false;
  }

  // Terminate the current test
  Terminate(): string {
    console.log('Terminate Called');

    const examResult = this.dataStore["cmi.score.raw"];
    const status = this.GetValue("cmi.completion_status");
    const testId = this.getCurrentTestId();

    // Mark the test as completed
    this.dataStore['completed'] = true;

    // Save the current state of the test and mark it as completed in the backend
    this.saveTestData(testId, examResult, status, true).subscribe((response: any) => {
      console.log(response);
      this.dataStore['completed'] = true;
    }, (error: any) => {
      console.error('Error sending test data:', error);
    });
    return 'true';
  }

  // Get a value from the dataStore or return a default value
  GetValue(element: string): string {
    console.log('API.GetValue()', element);

    // Default values for specific SCORM elements
    const defaultValues: { [key: string]: string } = {
        'cmi.completion_status': 'not attempted',
        'cmi.entry': 'ab-initio',
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

  // Commit the current state of the test to the backend
  Commit(): string {
    if (!this.initializationComplete$.getValue()) {
      console.warn('Initialization not complete. Cannot commit.');
      return 'false';
    }

    const testId = this.dataStore['testId'];
    if (!testId) {
      console.error('Test ID is missing from dataStore. Cannot commit.');
      return 'false';
    }

    const suspendDataString = JSON.stringify(this.dataStore);

    this.saveTestService.updateSuspendData(testId, suspendDataString).subscribe(
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
  private saveTestResultToBackend(data: any, testId?: string): any {
    const xhr = new XMLHttpRequest();
    const method = testId ? "PUT" : "POST";
    const url = testId ? `http://localhost:3000/api/savetests/${testId}` : "http://localhost:3000/api/savetests";

    xhr.open(method, url, false);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(data));

    if (xhr.status !== 200) {
      console.error('Error saving test result:', xhr.statusText);
      return null;
    }

    return JSON.parse(xhr.responseText);
  }
 // Save test data to the backend
 saveTestData(testId: string, score: string, status: string, completed: boolean): any {
  console.log('saveTestData Called');
  const currentAttemptNumber = this.dataStore['attempt_number'] || 0;
  const data = {
    name: 'Test Name',
    attempt_number: currentAttemptNumber,
    pass_status: status === 'passed',
    suspend_data: JSON.stringify({ score: score }),
    completed: completed
  };

  return this.saveTestResultToBackend(data, testId);
}

}
