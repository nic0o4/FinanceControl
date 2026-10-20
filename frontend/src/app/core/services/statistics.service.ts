import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-config';

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  private readonly apiUrl = `${API_BASE_URL}/statistics`;

  constructor(private http: HttpClient) {}

  dashboardSummary(): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/dashboard-summary`);
  }

  movementsByCategory(params?: {
    dateFrom?: string;
    dateTo?: string;
    accountId?: string;
  }): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/movements-by-category`, {
      params: this.toParams(params),
    });
  }

  timeline(params?: {
    dateFrom?: string;
    dateTo?: string;
    accountId?: string;
    groupBy?: string;
  }): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/timeline`, {
      params: this.toParams(params),
    });
  }

  summaryByAccount(): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/summary-by-account`);
  }

  incomeExpenseSummary(params?: {
    dateFrom?: string;
    dateTo?: string;
    accountId?: string;
  }): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/income-expense-summary`, {
      params: this.toParams(params),
    });
  }

  pendingCount(): Observable<{ pendingCount: number }> {
    return this.http.get<{ pendingCount: number }>(`${this.apiUrl}/pending-count`);
  }

  recentImports(limit = 10): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/recent-imports`, {
      params: { limit: String(limit) },
    });
  }

  private toParams(params?: Record<string, string | undefined>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        httpParams = httpParams.set(key, value);
      }
    }
    return httpParams;
  }
}
