import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, of } from 'rxjs';
import { SaveTest } from './models/savetest';

@Injectable({
  providedIn: 'root',
})
export class SaveTestService {
  // Base URL for the API endpoint
  private apiBaseUrl = 'http://localhost:3000/api/savetests';

  constructor(private http: HttpClient) {}

  /**
   * Fetches all test results.
   * @returns An observable of an array of SaveTest objects.
   */
  getAllTestResults(): Observable<SaveTest[]> {
    return this.http.get<SaveTest[]>(`${this.apiBaseUrl}`);
  }

  /**
   * Fetches a specific test result by its ID.
   * @param id - The ID of the test result to fetch.
   * @returns An observable of the test result.
   */
  getSpecificTestResult(id: string): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/${id}`);
  }

  /**
   * Creates a new test result.
   * @param testData - The data for the new test result.
   * @returns An observable of the created test result.
   */
  createTestResult(testData: {
    name: string;
    attempt_number: number;
    pass_status: boolean;
    suspend_data: string;
    completed: boolean;
  }): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}`, testData);
  }

  /**
   * Updates an existing test result.
   * @param id - The ID of the test result to update.
   * @param testData - The new data for the test result.
   * @returns An observable of the updated test result.
   */
  updateTestResult(id: string, testData: {
    name?: string;
    attempt_number?: number;
    pass_status?: boolean;
    suspend_data?: string;
    completed?: boolean;
  }): Observable<any> {
    return this.http.put(`${this.apiBaseUrl}/${id}`, testData);
  }

  /**
   * Fetches the latest test result.
   * @returns An observable of the latest test result or null if there's no latest test result.
   */
  getLatestTestResult(): Observable<SaveTest | null> {
    return this.http.get<SaveTest>(`${this.apiBaseUrl}/latest`).pipe(
      catchError(error => {
        console.error('Error fetching the latest test result:', error);
        // Return null if there's no latest test result
        return of(null);
      })
    );
  }

  /**
   * Updates the suspend data for a specific test result.
   * @param id - The ID of the test result to update.
   * @param suspend_data - The new suspend data for the test result.
   * @returns An observable of the updated test result.
   */
  updateSuspendData(id: string, suspend_data: string): Observable<any> {
    return this.http.put(`${this.apiBaseUrl}/${id}/suspend`, { suspend_data });
  }

  /**
   * Deletes a specific test result.
   * @param id - The ID of the test result to delete.
   * @returns An observable of the deleted test result.
   */
  deleteTestResult(id: string): Observable<any> {
    return this.http.delete(`${this.apiBaseUrl}/${id}`);
  }
}
