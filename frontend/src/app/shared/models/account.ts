export interface Account {
  id: number;
  description: string;
  bankName: string;
  accountType: string;
  currency: string;
  isActive: number;
  createdAt: string;
  updatedAt: string;
  transactionCount?: number;
}

export interface AccountCreateRequest {
  description: string;
  bankName: string;
  accountType: string;
  currency: string;
}

export interface AccountUpdateRequest {
  description: string;
  bankName: string;
  accountType: string;
  currency: string;
}

export type AccountType = 'CURRENT' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'OTHER';

export const ACCOUNT_TYPES: AccountType[] = [
  'CURRENT',
  'SAVINGS',
  'CREDIT_CARD',
  'INVESTMENT',
  'OTHER',
];
