import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

    // In Ontrack this would be set by the logged in students ID
    const studentId = 123456;
    this.dataStore['cmi.learner_id'] = studentId;

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
       } catch (error) {
           console.error('Error parsing JSON:', error);
           return 'false';
       }

       // Always resume the test, regardless of its 'completed' status
       this.resumeExistingTest(latestTest);

       this.initializationComplete$.next(true);
       return 'true';
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

  Terminate(): string {
    console.log('Terminate Called');

    const examResult = this.dataStore["cmi.score.raw"];
    const status = this.GetValue("cmi.completion_status");
    const testId = this.getCurrentTestId();

    // Mark the test as completed
    this.dataStore['completed'] = true;

    const currentAttemptNumber = this.dataStore['attempt_number'] || 0;

    const data = {
        name: 'Test Name',
        attempt_number: currentAttemptNumber,
        pass_status: status === 'passed',
        suspend_data: JSON.stringify({ score: examResult }),
        completed: true
    };

    const xhr = new XMLHttpRequest();
    if (testId) {
        xhr.open("PUT", `http://localhost:3000/api/savetest/savetests/${testId}`, false);

    } else {
        xhr.open("POST", "http://localhost:3000/api/savetest/savetests", false);


    }
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(data));

    if (xhr.status !== 200) {
        console.error('Error sending test data:', xhr.statusText);
        return 'false';
    }

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

  private isCommitCalled = false;

  Commit(): string {
    if (this.isCommitCalled) {
      console.warn('Commit function has already been called once.');
      return 'false';
    }

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
    const endpointUrl = `/api/savetest/savetest/${testId}/suspend`;

    const xhr = new XMLHttpRequest();
    xhr.open('PUT', endpointUrl, false); // `false` makes it synchronous
    xhr.setRequestHeader('Content-Type', 'application/json');

    try {
      xhr.send(suspendDataString);

      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('Suspend data saved successfully.');
        this.isCommitCalled = true;
        return 'true';
      } else {
        console.error('Error saving suspend data:', xhr.statusText);
        return 'false';
      }
    } catch (error) {
      console.error('Error saving suspend data:', error);
      return 'false';
    }
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
