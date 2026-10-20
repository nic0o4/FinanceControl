import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-config';
import {
  Category,
  CategoryCreateRequest,
  CategoryUpdateRequest,
} from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly apiUrl = `${API_BASE_URL}/categories`;

  constructor(private http: HttpClient) {}

  list(includeInactive = false): Observable<{ categories: Category[] }> {
    return this.http.get<{ categories: Category[] }>(this.apiUrl, {
      params: { includeInactive: includeInactive ? 'true' : 'false' },
    });
  }

  get(id: number): Observable<{ category: Category }> {
    return this.http.get<{ category: Category }>(`${this.apiUrl}/${id}`);
  }

  create(payload: CategoryCreateRequest): Observable<{ category: Category }> {
    return this.http.post<{ category: Category }>(this.apiUrl, payload);
  }

  update(id: number, payload: CategoryUpdateRequest): Observable<{ category: Category }> {
    return this.http.patch<{ category: Category }>(`${this.apiUrl}/${id}`, payload);
  }

  toggleStatus(id: number, isActive: boolean): Observable<{ category: Category }> {
    return this.http.patch<{ category: Category }>(
      `${this.apiUrl}/${id}/status`,
      { isActive }
    );
  }

  remove(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`);
  }
}
