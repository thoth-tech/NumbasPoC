import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SaveTestService } from './savetest.service';

declare let pipwerks: any;

@Injectable({
  providedIn: 'root'
})
export class LmsService {
  dataStore: { [key: string]: any } = {};
  initialized: boolean = false;

  constructor(private http: HttpClient, private saveTestService: SaveTestService) {
    pipwerks.SCORM.version = "2004";
    console.log(`SCORM version is set to: ${pipwerks.SCORM.version}`);
  }

  Initialize(): string {
    console.log('Initialize() function called');
    this.saveTestService.getLatestTestResult().subscribe((latestTest) => {
      if (latestTest) {
        if (latestTest.completed === false) {
          // Existing test that is not complete, parse the suspend_data
          try {
            this.dataStore = JSON.parse(latestTest.suspend_data || '{}');
            this.dataStore['testId'] = latestTest.id; // Set the existing test ID
            console.log(`Resuming Test ID: ${latestTest.id}`);
            this.dataStore['cmi.entry'] = 'resume';
          } catch (error) {
            console.error('Error parsing suspend_data:', error);
          }
        } else {
          // Existing test that is complete, create a new test
          this.createNewTest(latestTest.attempt_number + 1);
        }
      } else {
        // No previous test found, create a new test
        this.createNewTest(1);
      }
    });

    return 'true';
  }


  private createNewTest(attemptNumber: number) {
    const newTestDetails = {
      name: 'New Test Name',
      attempt_number: attemptNumber,
      pass_status: false,
      suspend_data: '{}',
      completed: false,
    };

    this.saveTestService.createTestResult(newTestDetails).subscribe((newTest) => {
      // Initialize the new test attempt as needed
      console.log(`Creating new Test ID: ${newTest.id}`);
      this.dataStore['testId'] = newTest.id;

    });
  }

  getCurrentTestId(): string {
    return this.dataStore?.['testId'];
  }

  isTestCompleted(): boolean {
    return this.dataStore?.['completed'] || false;
  }

  Terminate(): string {
    const success = pipwerks.SCORM.connection.terminate();
    const examResult = pipwerks.SCORM.data.get("cmi.score.raw");
    const status = this.GetValue("cmi.completion_status");
    const testId = this.getCurrentTestId();
    const completed = this.isTestCompleted();

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
  console.log('set value called');
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
  console.log('Commit function called');
  const testId = this.getCurrentTestId();
  if (!testId) {
    console.error('Test ID is undefined. Cannot commit.');
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
    const data = {
      name: 'Test Name',
      attempt_number: 1, // You may want to handle this dynamically
      pass_status: status === 'passed',
      suspend_data: JSON.stringify({ score: score }),
      completed: completed
    };

    if (testId) {
      return this.saveTestService.updateTestResult(testId, data);
    } else {
      return this.saveTestService.createTestResult(data);
    }
  }

}
