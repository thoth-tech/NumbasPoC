import { Component, OnInit } from '@angular/core';
import { NumbasService } from './numbas.service'; // Replace with the actual path to your numbas.service.ts file

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'my-app';
  indexHtml: any;
  fileData: any;

  constructor(private numbasService: NumbasService) { }

  ngOnInit(): void {
    this.loadIndexHtml();
  }

  loadIndexHtml(): void {
    this.numbasService.getIndexHtml().subscribe(
      (data) => {
        this.indexHtml = data;
        console.log('Index HTML:', this.indexHtml);
        // If you need to load any other file, you can call the getFile method here
        // this.loadFile('path/to/other/file');
      },
      (error) => {
        console.error('Error fetching index HTML:', error);
      }
    );
  }

  loadFile(filePath: string): void {
    this.numbasService.getFile(filePath).subscribe(
      (data) => {
        this.fileData = data;
        console.log('File data:', this.fileData);
      },
      (error) => {
        console.error('Error fetching file:', error);
      }
    );
  }
}
