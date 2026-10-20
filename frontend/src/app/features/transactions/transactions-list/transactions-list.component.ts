import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { Transaction } from '../../../shared/models/transaction';
import { Category } from '../../../shared/models/category';

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './transactions-list.component.html',
  styleUrl: './transactions-list.component.scss',
})
export class TransactionsListComponent implements OnInit {
  transactions: Transaction[] = [];
  categories: Category[] = [];
  loading = true;
  error = '';

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.load();
    this.categoryService.list().subscribe({
      next: (res) => (this.categories = res.categories),
      error: () => (this.categories = []),
    });
  }

  load(): void {
    this.loading = true;
    this.transactionService.list().subscribe({
      next: (res) => {
        this.transactions = res.transactions;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.error || 'No se pudieron cargar los movimientos.';
        this.loading = false;
      },
    });
  }

  updateCategory(id: number, categoryId: number | undefined): void {
    this.transactionService.updateCategory(id, { categoryId }).subscribe({
      next: () => this.load(),
    });
  }

  onCategoryChange(id: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const categoryId = select.value ? Number(select.value) : undefined;
    this.updateCategory(id, categoryId);
  }

  categoryName(catId?: number): string {
    if (!catId) return 'Sin categoría';
    const c = this.categories.find((x) => x.id === catId);
    return c ? c.name : 'Sin categoría';
  }
}
