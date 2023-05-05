import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NumbasService {
  private readonly API_URL = 'http://localhost:3000/api/numbas_api/index.html'; 

  constructor(private http: HttpClient) {}

  getNumbasTest(): Observable<any> {
    return this.http.get(`${this.API_URL}`, { responseType: 'text' }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching Numbas test:', error);
        return throwError('Error fetching Numbas test.');
      })
    );
  }
  
  
  
}
