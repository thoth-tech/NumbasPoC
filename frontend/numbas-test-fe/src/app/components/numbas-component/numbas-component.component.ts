import { Component, OnInit } from '@angular/core';
import { NumbasService } from '../../services/numbas.service';
import jsPDF from 'jspdf';

declare global {
  interface Window { API: any; }
}

@Component({
  selector: 'app-numbas',
  templateUrl: './numbas-component.component.html'
})
export class NumbasComponent implements OnInit {
  dataStore: { [key: string]: string } = {};

  constructor(private numbasService: NumbasService) {}

  ngOnInit(): void {
    this.interceptIframeRequests();
  }

  launchNumbasTest(): void {
    const iframe = document.createElement('iframe');
    iframe.src = 'http://localhost:4200/api/numbas_api/index.html';
    iframe.style.width = '100%';
    iframe.style.height = '800px';
    document.body.appendChild(iframe);

    window.API = {
      LMSInitialize: () => { console.log('API.init()'); return "true"; },
      LMSFinish: () => {
        console.log('API.LMSFinish()');
        let examResult = JSON.parse(this.dataStore['cmi.suspend_data']);

        // Create a new jsPDF instance
        const doc = new jsPDF();
      
        // Set the document's title
        doc.setFontSize(18);
        doc.text('Advanced Number Theory Exam Results', 10, 20);
      
        // Extract the exam details
        const examName = examResult['examName'];
        const sessionId = examResult['sessionId'];
        const examStart = examResult['examStart'];
        const examStop = examResult['examStop'];
        const timeSpent = examResult['timeSpent'];
      
        // Display the overall score and maximum possible score
        const totalScore = parseInt(this.dataStore['cmi.score.raw']);
        const maxScore = parseInt(this.dataStore['cmi.score.max']);
        const scorePercentage = ((totalScore / maxScore) * 100).toFixed(2);
        const overallScoreText = `Overall score: ${totalScore} / ${maxScore} (${scorePercentage}%)`;
        doc.setFontSize(12);
        doc.text(overallScoreText, 10, 30);
      
        // Display the completion status
        const completionStatus = this.dataStore['cmi.completion_status'];
        doc.text(`Completion status: ${completionStatus}`, 10, 40);
      
        // Display the time spent on the exam
        doc.text(`Time spent: ${timeSpent}`, 10, 50);
      
        // Extract the individual question scores
        const questionScores = examResult['questionScores'];
        let y = 60;
        for (const questionScore of questionScores) {
          const questionNumber = questionScore.questionNumber;
          const score = questionScore.score;
          const maxScore = questionScore.maxScore;
          const questionText = `Question ${questionNumber}: ${score} / ${maxScore}`;
          doc.text(questionText, 10, y);
          y += 10;
        }
      
        // Save the PDF
        doc.save('exam_results.pdf');
      },
      
      LMSGetValue: (element: string) => { 
        console.log('API.LMSGetValue()', element);
        let result = "";
        switch (element) {
          case 'cmi.core.lesson_status':
            result = 'not attempted'; 
            break;
          case 'cmi.entry':
            result = 'ab-initio'; 
            break;
          case 'cmi.objectives._count':
          case 'cmi.interactions._count':
            result = '0';
            break;
          case 'numbas.user_role':
            result = 'learner'; 
            break;
          case 'numbas.duration_extension.amount':
            result = '0';
            break;
          case 'numbas.duration_extension.units':
            result = 'seconds'; 
            break;
          case 'cmi.mode':
            result = 'normal';
            break;
          default:
            result = this.dataStore[element] || "";
        }
        return result;
      },
      LMSSetValue: (element: string, value: string) => { 
        console.log('API.LMSSetValue()', element, value);
        this.dataStore[element] = value;
        return "true"; 
      },
      LMSCommit: () => { console.log('API.LMSCommit()'); return "true"; },
      LMSGetLastError: () => { console.log('API.LMSGetLastError()'); return "0"; },
      LMSGetErrorString: (errorCode: string) => { 
        console.log('API.LMSGetErrorString()', errorCode);
        return "";
      },
      LMSGetDiagnostic: (errorCode: string) => { 
        console.log('API.LMSGetDiagnostic()', errorCode);
        return "";
      }
    }
  }

  interceptIframeRequests(): void {
    const originalOpen = XMLHttpRequest.prototype.open;
    const numbasService = this.numbasService;
    XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, method: string, url: string | URL, async: boolean = true, username?: string | null, password?: string | null) {
      if (typeof url === 'string' && url.startsWith('/api/numbas_api/')) {
        const resourcePath = url.replace('/api/numbas_api/', '');
        this.abort();
        numbasService.fetchResource(resourcePath).subscribe(
          (resourceData) => {
            if (this.onload) {
              this.onload.call(this, resourceData);
            }
          },
          (error) => {
            console.error('Error fetching Numbas resource:', error);
          }
        );
      } else {
        originalOpen.call(this, method, url, async, username, password);
      }
    };
  }
}
