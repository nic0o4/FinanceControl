import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClassificationService } from '../../../core/services/classification.service';
import { ClassificationRule } from '../../../shared/models/classification-rule';

@Component({
  selector: 'app-classification-rules-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './classification-rules-list.component.html',
  styleUrl: './classification-rules-list.component.scss',
})
export class ClassificationRulesListComponent implements OnInit {
  rules: ClassificationRule[] = [];
  loading = true;
  error = '';

  constructor(private classificationService: ClassificationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.classificationService.list().subscribe({
      next: (res) => {
        this.rules = res.rules;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.error || 'No se pudieron cargar las reglas.';
        this.loading = false;
      },
    });
  }

  toggleStatus(rule: ClassificationRule, isActive: boolean): void {
    this.classificationService.toggleStatus(rule.id, isActive).subscribe({
      next: () => this.load(),
    });
  }

  remove(rule: ClassificationRule): void {
    if (!confirm('¿Eliminar esta regla?')) {
      return;
    }
    this.classificationService.remove(rule.id).subscribe({
      next: () => this.load(),
    });
  }
}
