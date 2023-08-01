import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SaveTest } from './models/savetest';

@Injectable({
  providedIn: 'root',
})
export class SaveTestService {
  private apiBaseUrl = 'http://localhost:3000/api/savetest';

  constructor(private http: HttpClient) {}

  getAllTestResults(): Observable<SaveTest[]> {
    return this.http.get<SaveTest[]>(`${this.apiBaseUrl}`);
  }

  getSpecificTestResult(id: string): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/${id}`);
  }

  createTestResult(testData: {
    name: string;
    attempt_number: number;
    pass_status: boolean;
    suspend_data: string;
    completed?: boolean;
  }): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}`, testData);
  }

  updateTestResult(id: string, testData: {
    name?: string;
    attempt_number?: number;
    pass_status?: boolean;
    suspend_data?: string;
    completed?: boolean;
  }): Observable<any> {
    return this.http.put(`${this.apiBaseUrl}/${id}`, testData);
  }

  getLatestTestResult(): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/latest`);
  }

  updateSuspendData(id: string, suspend_data: string): Observable<any> {
    return this.http.put(`${this.apiBaseUrl}/${id}/suspend`, { suspend_data });
  }


  deleteTestResult(id: string): Observable<any> {
    return this.http.delete(`${this.apiBaseUrl}/${id}`);
  }

}
