import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImportService } from '../../../core/services/import.service';
import { ImportRecord } from '../../../shared/models/import';

@Component({
  selector: 'app-import-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import-history.component.html',
  styleUrl: './import-history.component.scss',
})
export class ImportHistoryComponent implements OnInit {
  imports: ImportRecord[] = [];
  loading = true;
  error = '';

  constructor(private importService: ImportService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.importService.history().subscribe({
      next: (res: any) => {
        this.imports = res?.imports ?? res?.data ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.error || 'No se pudo cargar el historial.';
        this.loading = false;
      },
    });
  }
}
