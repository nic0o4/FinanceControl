import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClassificationService } from '../../../core/services/classification.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../shared/models/category';

@Component({
  selector: 'app-classification-rules-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './classification-rules-create.component.html',
  styleUrl: './classification-rules-create.component.scss',
})
export class ClassificationRulesCreateComponent {
  form: FormGroup;
  categories: Category[] = [];
  error = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private classificationService: ClassificationService,
    private categoryService: CategoryService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      conditionsJson: ['{}', Validators.required],
      categoryId: ['', Validators.required],
      priority: [0],
    });

    categoryService.list().subscribe({
      next: (res) => (this.categories = res.categories),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    this.error = '';
    this.classificationService.create(this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/classification-rules']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error || 'No se pudo crear la regla.';
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/classification-rules']);
  }
}
