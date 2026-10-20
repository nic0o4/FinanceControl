import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { Account } from '../../../shared/models/account';

@Component({
  selector: 'app-accounts-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './accounts-list.component.html',
  styleUrl: './accounts-list.component.scss',
})
export class AccountsListComponent implements OnInit {
  accounts: Account[] = [];
  loading = true;
  error = '';

  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    this.load();
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
}
