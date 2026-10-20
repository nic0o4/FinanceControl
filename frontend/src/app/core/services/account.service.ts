import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-config';
import {
  Account,
  AccountCreateRequest,
  AccountUpdateRequest,
} from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly apiUrl = `${API_BASE_URL}/accounts`;

  constructor(private http: HttpClient) {}

  list(includeInactive = false): Observable<{ accounts: Account[] }> {
    return this.http.get<{ accounts: Account[] }>(this.apiUrl, {
      params: { includeInactive: includeInactive ? 'true' : 'false' },
    });
  }

  get(id: number): Observable<{ account: Account }> {
    return this.http.get<{ account: Account }>(`${this.apiUrl}/${id}`);
  }

  create(payload: AccountCreateRequest): Observable<{ account: Account }> {
    return this.http.post<{ account: Account }>(this.apiUrl, payload);
  }

  update(id: number, payload: AccountUpdateRequest): Observable<{ account: Account }> {
    return this.http.patch<{ account: Account }>(`${this.apiUrl}/${id}`, payload);
  }

  toggleStatus(id: number, isActive: boolean): Observable<{ account: Account }> {
    return this.http.patch<{ account: Account }>(
      `${this.apiUrl}/${id}/status`,
      { isActive }
    );
  }
}
