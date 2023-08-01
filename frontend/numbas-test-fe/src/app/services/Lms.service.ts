import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import jsPDF from 'jspdf';
import { SaveTestService } from './savetest.service';

declare let pipwerks: any;

@Injectable({
  providedIn: 'root'
})
export class LmsService {
  dataStore: { [key: string]: any } = {};
  initialized: boolean = false;
  constructor(private http: HttpClient,
    private saveTestService: SaveTestService
    ) {
    pipwerks.SCORM.version = "2004";
    console.log(`SCORM version is set to: ${pipwerks.SCORM.version}`);

  }
  Initialize(): string {
    this.saveTestService.getLatestTestResult().subscribe((latestTest) => {
      if (latestTest) {
        if (latestTest.completed === false) {
          // If the latest test is not complete, populate the local data store with the suspend data
          this.dataStore = JSON.parse(latestTest.suspend_data);
          console.log(`Resuming Test ID: ${latestTest.id}`);
        } else {
          // If the latest test is complete, create a new test attempt with the next ID
          const newTestDetails = {
            name: 'New Test Name',
            attempt_number: latestTest.attempt_number + 1, // Incrementing the attempt number
            pass_status: false,
            suspend_data: '', // Initial suspend data if needed
          };

          this.saveTestService.createTestResult(newTestDetails).subscribe((newTest) => {
            // Initialize the new test attempt as needed
            console.log(`Creating new Test ID: ${newTest.id}`);
            this.dataStore['testId'] = newTest.id; // Set the new test ID in the data store
          });
        }
      } else {
        // Handle the case where there's no latest test in the DB
        console.log('No previous test found. Creating new test...');
        const newTestDetails = {
          name: 'New Test Name',
          attempt_number: 1, // Initial attempt number
          pass_status: false,
          suspend_data: '', // Initial suspend data if needed
        };

        this.saveTestService.createTestResult(newTestDetails).subscribe((newTest) => {
          // Initialize the new test attempt as needed
          console.log(`Creating new Test ID: ${newTest.id}`);
          this.dataStore['testId'] = newTest.id; // Set the new test ID in the data store
        });
      }
    });

    return 'true';
  }



  private currentTest: any;

  getCurrentTestId(): string {

    const testId = this.dataStore?.['testId'] || this.generateTestId();
  return testId;
  }
  generateTestId(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const idLength = 10;
    let result = '';
    for (let i = 0; i < idLength; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
  isTestCompleted(): boolean {
    return this.currentTest ? this.currentTest.completed : false;
  }
  Terminate(): string {
    const success = pipwerks.SCORM.connection.terminate();

    const examResult = pipwerks.SCORM.data.get("cmi.score.raw");
    const status = this.GetValue("cmi.completion_status");
    const testId = this.getCurrentTestId();
    const completed = this.isTestCompleted();

    // Send the score, status, test ID, and completed status to the server
    this.saveTestData(testId, examResult, status, completed).subscribe((response) => {
      console.log(response);
    }, (error) => {
      console.error('Error sending test data:', error);
    });

    return 'true';
  }


  GetValue(element: string): string {
    console.log('API.GetValue()', element);
    let result: string;

    switch (element) {
        case 'cmi.completion_status':
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


SetValue(element: string, value: any): string {
  if (element.startsWith('cmi.')) {
      this.dataStore[element] = value;
  }

  if (element === 'cmi.exit' && value === 'suspend') {
    // https://scorm.com/scorm-explained/technical-scorm/run-time/run-time-reference/
    this.dataStore['cmi.entry'] = 'resume';
  }

  return 'true';
}


Commit(): string {
  const testId = this.getCurrentTestId();
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


  GetLastError(): string {
    return "0";
  }

  GetErrorString(errorCode: string): string {
    return '';
  }

  GetDiagnostic(errorCode: string): string {
    return '';
  }

  saveTestData(testId: string, score: string, status: string, completed: boolean): Observable<any> {
    // Construct the data to match what the SaveTestService expects
    const data = {
      name: 'Test Name',
      attempt_number: 1,
      pass_status: status === 'passed',
      suspend_data: JSON.stringify({ score: score }),
      completed: completed
    };

    // Use SaveTestService method to create a new test result
    return this.saveTestService.updateTestResult(testId, data);
  }


}
