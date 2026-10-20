export interface Transaction {
  id: number;
  accountId: number;
  importId?: number;
  operationDate: string;
  valueDate?: string;
  description: string;
  concept: string;
  amount: number;
  currency: string;
  balanceAfterOperation?: number;
  bankReference?: string;
  externalTransactionId?: string;
  categoryId?: number;
  categoryName?: string;
  rawDataJson?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilters {
  page?: number;
  pageSize?: number;
  accountId?: string;
  categoryId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  onlyDuplicates?: boolean;
  sortBy?: string;
  sortDir?: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TransactionCategoryUpdate {
  categoryId?: number;
}

export interface BulkClassifyRequest {
  ids: number[];
  categoryId: number;
}
