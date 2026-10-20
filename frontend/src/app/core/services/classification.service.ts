import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-config';
import {
  ClassificationRule,
  ClassificationRuleCreateRequest,
  ClassificationRuleUpdateRequest,
  ClassificationRuleStatusUpdate,
  RuleTestRequest,
  RuleProposeResponse,
} from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ClassificationService {
  private readonly apiUrl = `${API_BASE_URL}/classification-rules`;

  constructor(private http: HttpClient) {}

  list(includeInactive = false): Observable<{ rules: ClassificationRule[] }> {
    return this.http.get<{ rules: ClassificationRule[] }>(this.apiUrl, {
      params: { includeInactive: includeInactive ? 'true' : 'false' },
    });
  }

  get(id: number): Observable<{ rule: ClassificationRule }> {
    return this.http.get<{ rule: ClassificationRule }>(`${this.apiUrl}/${id}`);
  }

  create(
    payload: ClassificationRuleCreateRequest
  ): Observable<{ rule: ClassificationRule }> {
    return this.http.post<{ rule: ClassificationRule }>(this.apiUrl, payload);
  }

  update(
    id: number,
    payload: ClassificationRuleUpdateRequest
  ): Observable<{ rule: ClassificationRule }> {
    return this.http.patch<{ rule: ClassificationRule }>(
      `${this.apiUrl}/${id}`,
      payload
    );
  }

  remove(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`);
  }

  toggleStatus(id: number, isActive: boolean): Observable<{ rule: ClassificationRule }> {
    return this.http.patch<{ rule: ClassificationRule }>(
      `${this.apiUrl}/${id}/status`,
      { isActive }
    );
  }

  test(payload: RuleTestRequest): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/test`, payload);
  }

  propose(transaction: unknown): Observable<RuleProposeResponse> {
    return this.http.post<RuleProposeResponse>(
      `${this.apiUrl}/propose`,
      transaction
    );
  }
}
