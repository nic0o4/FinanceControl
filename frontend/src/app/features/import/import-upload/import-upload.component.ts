import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ImportService } from '../../../core/services/import.service';
import { AccountService } from '../../../core/services/account.service';
import { Account } from '../../../shared/models/account';

@Component({
  selector: 'app-import-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './import-upload.component.html',
  styleUrl: './import-upload.component.scss',
})
export class ImportUploadComponent {
  accounts: Account[] = [];
  file: File | null = null;
  preview: any = null;
  loading = false;
  error = '';
  accountId = '';

  constructor(
    private importService: ImportService,
    private accountService: AccountService,
    private router: Router
  ) {
    accountService.list().subscribe({
      next: (res) => (this.accounts = res.accounts),
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.file = input.files[0];
      this.preview = null;
    }
  }

  previewFile(): void {
    if (!this.file) return;
    this.loading = true;
    this.error = '';
    this.importService.preview(this.file, this.accountId || undefined).subscribe({
      next: (res) => {
        this.preview = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.error || 'Error al previsualizar el archivo.';
        this.loading = false;
      },
    });
  }

  confirm(): void {
    if (!this.preview || !this.accountId) return;
    this.loading = true;
    this.importService
      .confirm({
        importId: this.preview.importId ?? 0,
        accountId: Number(this.accountId),
        rows: this.preview.rows,
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/import/history']);
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.error || 'Error al confirmar la importación.';
        },
      });
  }

  cancel(): void {
    if (!this.preview?.importId) return;
    this.importService.cancel({ importId: this.preview.importId }).subscribe({
      next: () => {
        this.preview = null;
        this.file = null;
      },
    });
  }
}
