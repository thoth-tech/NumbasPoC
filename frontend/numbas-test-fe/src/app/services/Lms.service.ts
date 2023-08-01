import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import jsPDF from 'jspdf';
declare let pipwerks: any;

@Injectable({
  providedIn: 'root'
})
export class LmsService {
  dataStore: { [key: string]: any } = {};
  initialized: boolean = false;
  constructor(private http: HttpClient) {
    pipwerks.SCORM.version = "2004";
    console.log(`SCORM version is set to: ${pipwerks.SCORM.version}`);

  }
  Initialize(): string {
    return 'true';
}

  Terminate(): string {
    const success = pipwerks.SCORM.connection.terminate();


    const examResult = pipwerks.SCORM.data.get("cmi.score.raw");
    const status = this.GetValue("cmi.completion_status");

    // Create a new jsPDF instance
    const doc = new jsPDF();

    // Add some text content
    doc.text(`Exam Result: ${examResult}`, 10, 10);

    // Save the PDF
    doc.save('examResult.pdf');

    // Send the score and status to the server
    this.saveTestData(examResult, status).subscribe((response) => {
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

  saveTestData(score: string, status: string): Observable<any> {
    const url = 'http://localhost:3000/api/testdata';

    const data = {
      score: score,
      status: status,
    };

    return this.http.post(url, data);
  }
}
