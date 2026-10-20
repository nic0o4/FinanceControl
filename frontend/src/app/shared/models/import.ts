export interface ImportRecord {
  id: number;
  accountId: number;
  filename: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  totalRows: number;
  insertedRows: number;
  duplicateRows: number;
  rejectedRows: number;
  errorSummary?: string;
}

export interface ImportPreviewRow {
  // parsed row from the uploaded Excel file
  [key: string]: unknown;
}

export interface ImportPreviewResponse {
  accountId?: number;
  rows: ImportPreviewRow[];
  totalRows: number;
  duplicates: ImportPreviewRow[];
  newRows: ImportPreviewRow[];
  importId?: number;
}

export interface ImportConfirmRequest {
  importId: number;
  accountId: number;
  rows: ImportPreviewRow[];
}

export interface ImportCancelRequest {
  importId: number;
}
