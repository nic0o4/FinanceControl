export interface Category {
  id: number;
  name: string;
  description: string;
  isActive: number;
  createdAt: string;
  updatedAt: string;
  transactionCount?: number;
}

export interface CategoryCreateRequest {
  name: string;
  description?: string;
}

export interface CategoryUpdateRequest {
  name: string;
  description?: string;
}
