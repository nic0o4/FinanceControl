import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../shared/models/category';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './categories-list.component.html',
  styleUrl: './categories-list.component.scss',
})
export class CategoriesListComponent implements OnInit {
  categories: Category[] = [];
  loading = true;
  error = '';

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.categoryService.list().subscribe({
      next: (res) => {
        this.categories = res.categories;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.error || 'No se pudieron cargar las categorías.';
        this.loading = false;
      },
    });
  }

  toggleStatus(category: Category, isActive: boolean): void {
    this.categoryService.toggleStatus(category.id, isActive).subscribe({
      next: () => this.load(),
    });
  }

  remove(category: Category): void {
    if (!confirm('¿Eliminar esta categoría?')) {
      return;
    }
    this.categoryService.remove(category.id).subscribe({
      next: () => this.load(),
    });
  }
}
