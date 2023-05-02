import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NumbasService {
  private readonly API_URL = 'http://localhost:3000/numbas_api'; // Replace with the actual API URL

  constructor(private http: HttpClient) {}

  getIndexHtml(): Observable<any> {
    return this.http.get(`${this.API_URL}/index.html`, { responseType: 'text' });
  }

  getFile(path: string): Observable<any> {
    return this.http.get(`${this.API_URL}/${path}`, { responseType: 'blob' });
  }
}
