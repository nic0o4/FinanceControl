import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-config';
import {
  ImportRecord,
  ImportPreviewResponse,
  ImportConfirmRequest,
  ImportCancelRequest,
} from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ImportService {
  private readonly apiUrl = `${API_BASE_URL}/imports`;

  constructor(private http: HttpClient) {}

  upload(file: File, accountId?: string): Observable<ImportPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (accountId) {
      formData.append('accountId', accountId);
    }
    return this.http.post<ImportPreviewResponse>(`${this.apiUrl}/upload`, formData);
  }

  preview(file: File, accountId?: string): Observable<ImportPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (accountId) {
      formData.append('accountId', accountId);
    }
    return this.http.post<ImportPreviewResponse>(`${this.apiUrl}/preview`, formData);
  }

  confirm(payload: ImportConfirmRequest): Observable<{ import: ImportRecord }> {
    return this.http.post<{ import: ImportRecord }>(
      `${this.apiUrl}/confirm`,
      payload
    );
  }

  cancel(payload: ImportCancelRequest): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/cancel`, payload);
  }

  history(limit = 50, offset = 0): Observable<unknown> {
    return this.http.get(this.apiUrl + '/history', {
      params: { limit: String(limit), offset: String(offset) },
    });
  }

  getDetail(id: number): Observable<{ import: ImportRecord }> {
    return this.http.get<{ import: ImportRecord }>(`${this.apiUrl}/${id}`);
  }
}
