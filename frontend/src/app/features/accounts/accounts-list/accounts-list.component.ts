import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { Account } from '../../../shared/models/account';

@Component({
  selector: 'app-accounts-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './accounts-list.component.html',
  styleUrl: './accounts-list.component.scss',
})
export class AccountsListComponent implements OnInit {
  accounts: Account[] = [];
  loading = true;
  error = '';
  showConfigModal = false;
  configuringAccount: Account | null = null;
  configSkipRows = 0;
  configColumnMapping: Record<string, number> = {};

  mappingFields = [
    { key: 'operation_date', label: 'Fecha operación' },
    { key: 'value_date', label: 'Fecha valor' },
    { key: 'description', label: 'Descripción' },
    { key: 'concept', label: 'Concepto' },
    { key: 'amount', label: 'Importe' },
    { key: 'charge', label: 'Cargo' },
    { key: 'credit', label: 'Abono' },
    { key: 'balance', label: 'Saldo' },
    { key: 'bank_reference', label: 'Referencia bancaria' },
    { key: 'external_transaction_id', label: 'ID operación' },
    { key: 'currency', label: 'Divisa' },
  ];

  columnOptions = [{ value: -1, label: 'No mapeado' }];

  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    this.load();
    for (let i = 0; i <= 20; i++) {
      this.columnOptions.push({ value: i, label: `Columna ${i}` });
    }
  }

  load(): void {
    this.loading = true;
    this.accountService.list().subscribe({
      next: (res) => {
        this.accounts = res.accounts;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.error || 'No se pudieron cargar las cuentas.';
        this.loading = false;
      },
    });
  }

  toggleStatus(account: Account, isActive: boolean): void {
    this.accountService.toggleStatus(account.id, isActive).subscribe({
      next: () => this.load(),
    });
  }

  openConfigModal(account: Account): void {
    this.configuringAccount = account;
    this.configSkipRows = account.importSkipRows ?? 0;
    this.configColumnMapping = { ...(account.importColumnMapping ?? {}) };
    this.showConfigModal = true;
  }

  closeConfigModal(): void {
    this.showConfigModal = false;
    this.configuringAccount = null;
  }

  saveConfig(): void {
    if (!this.configuringAccount) return;

    this.accountService
      .update(this.configuringAccount.id, {
        importSkipRows: this.configSkipRows,
        importColumnMapping: this.configColumnMapping,
      })
      .subscribe({
        next: () => {
          this.load();
          this.closeConfigModal();
        },
        error: (err) => {
          this.error = err?.error?.error || 'No se pudo guardar la configuración.';
        },
      });
  }
}
