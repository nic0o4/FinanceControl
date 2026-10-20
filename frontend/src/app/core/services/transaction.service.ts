import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-config';
import {
  Transaction,
  TransactionFilters,
  TransactionListResponse,
  TransactionCategoryUpdate,
  BulkClassifyRequest,
} from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly apiUrl = `${API_BASE_URL}/transactions`;

  constructor(private http: HttpClient) {}

  list(filters: TransactionFilters = {}): Observable<TransactionListResponse> {
    let params = new HttpParams();
    params = params.set('page', String(filters.page ?? 1));
    params = params.set('pageSize', String(filters.pageSize ?? 20));
    if (filters.accountId) params = params.set('accountId', filters.accountId);
    if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.minAmount !== undefined)
      params = params.set('minAmount', String(filters.minAmount));
    if (filters.maxAmount !== undefined)
      params = params.set('maxAmount', String(filters.maxAmount));
    if (filters.onlyDuplicates !== undefined)
      params = params.set('onlyDuplicates', String(filters.onlyDuplicates));
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDir) params = params.set('sortDir', filters.sortDir);

    return this.http.get<TransactionListResponse>(this.apiUrl, { params });
  }

  get(id: number): Observable<{ transaction: Transaction }> {
    return this.http.get<{ transaction: Transaction }>(`${this.apiUrl}/${id}`);
  }

  updateCategory(
    id: number,
    payload: TransactionCategoryUpdate
  ): Observable<{ transaction: Transaction }> {
    return this.http.patch<{ transaction: Transaction }>(
      `${this.apiUrl}/${id}/category`,
      payload
    );
  }

  bulkClassify(payload: BulkClassifyRequest): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/bulk-classify`, payload);
  }

  pending(limit = 100): Observable<{ transactions: Transaction[] }> {
    return this.http.get<{ transactions: Transaction[] }>(
      `${this.apiUrl}/pending`,
      { params: { limit: String(limit) } }
    );
  }

  duplicates(limit = 100): Observable<{ transactions: Transaction[] }> {
    return this.http.get<{ transactions: Transaction[] }>(
      `${this.apiUrl}/duplicates`,
      { params: { limit: String(limit) } }
    );
  }

  export(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, {
      responseType: 'blob',
    });
  }
}
