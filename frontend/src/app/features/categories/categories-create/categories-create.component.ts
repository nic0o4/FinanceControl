import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../../core/services/category.service';

@Component({
  selector: 'app-categories-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './categories-create.component.html',
  styleUrl: './categories-create.component.scss',
})
export class CategoriesCreateComponent {
  form: FormGroup;
  error = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    this.error = '';
    this.categoryService.create(this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/categories']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error || 'No se pudo crear la categoría.';
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/categories']);
  }
}
