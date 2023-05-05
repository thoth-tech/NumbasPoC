import { Component } from '@angular/core';
import { NumbasService } from '../../services/numbas.service';

@Component({
  selector: 'app-numbas',
  templateUrl: './numbas-component.component.html'
})
export class NumbasComponent {
  constructor(private numbasService: NumbasService) {}

  launchNumbasTest(): void {
    this.numbasService.getNumbasTest().subscribe(
      (blobData) => {
        // Load the HTML data into an iframe
        const iframe = document.createElement('iframe');
        const reader = new FileReader();
        reader.addEventListener('loadend', () => {
          iframe.srcdoc = reader.result as string;
          iframe.style.width = '100%';
          iframe.style.height = '800px';
          document.body.appendChild(iframe);
        });
        reader.readAsText(blobData);
      },
      (error) => {
        console.error('Error fetching Numbas test:', error);
      }
    );
  }
  
}
