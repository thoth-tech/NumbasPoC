import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NumbasService {
  private readonly API_URL = 'http://localhost:3000/api/numbas_api';

  constructor(private http: HttpClient) {}

  fetchResource(resourcePath: string): Observable<any> {
    const resourceUrl = `${this.API_URL}/${resourcePath}`;
    const resourceMimeType = this.getMimeType(resourcePath);

    return this.http.get(resourceUrl, { responseType: 'blob' }).pipe(
      retry(3),  // Retrying up to 3 times before failing
      map((blob) => new Blob([blob], { type: resourceMimeType })),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching Numbas resource:', error);
        return throwError('Error fetching Numbas resource.');
      })
    );
  }

  getMimeType(resourcePath: string): string {
    const extension = resourcePath.split('.').pop()?.toLowerCase();
    const mimeTypeMap: { [key: string]: string } = {
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml'
      // Add any other needed MIME types here
    };

    return mimeTypeMap[extension || ''] || 'text/plain';
  }
}
