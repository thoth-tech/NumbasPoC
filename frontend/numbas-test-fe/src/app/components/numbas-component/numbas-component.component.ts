import { Component, OnInit, ElementRef } from '@angular/core';
import { NumbasService } from '../../services/numbas.service';
import { ScormService } from 'src/app/services/SCORM/scorm-service';

@Component({
  selector: 'app-numbas',
  templateUrl: './numbas-component.component.html'
})
export class NumbasComponent implements OnInit {
  constructor(private numbasService: NumbasService, private scormService: ScormService, private elRef: ElementRef) {}

  ngOnInit(): void {
    this.interceptIframeRequests();
    const launchButton = this.elRef.nativeElement.querySelector('#launchButton');
    launchButton.addEventListener('click', this.launchNumbasTest.bind(this));
  }

  launchNumbasTest(): void {
    const iframe = document.createElement('iframe');
    iframe.src = 'http://localhost:3000/api/numbas_api/index.html';
    iframe.style.width = '100%';
    iframe.style.height = '800px';
    document.body.appendChild(iframe);

    iframe.addEventListener('load', () => {
      // Wait for the iframe to fully load
      const isInitialized = this.scormService.init(iframe.contentWindow as Window);
      if (isInitialized) {
        // SCORM API connection successfully initialized
        // Perform further operations or communicate with the Numbas test
    
        // Listen for the "Finish Exam" event from the Numbas test
        iframe.contentWindow?.addEventListener('numbas:finishExam', this.handleFinishExam.bind(this));
      } else {
        // SCORM API initialization failed
        console.error('Failed to initialize SCORM API');
      }
    });
  }

  handleFinishExam(event: Event): void {
    // The Numbas test has finished, intercept and process the test results
    const testResults = this.scormService.get('cmi.interactions'); // Adjust the parameter as per your SCORM API structure
    console.log('Test results:', testResults);
    // Perform further processing or save the test results as needed
  
    // Get the score using the SCORM API
    const score = this.scormService.get('cmi.score.raw'); // Adjust the parameter as per your SCORM API structure
    console.log('Score:', score);
  }
  

  interceptIframeRequests(): void {
    const originalOpen = XMLHttpRequest.prototype.open;
    const numbasService = this.numbasService;
    XMLHttpRequest.prototype.open = function (
      this: XMLHttpRequest,
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ) {
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
