import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../core/services/account.service';
import { AccountType, ACCOUNT_TYPES } from '../../../shared/models/account';

@Component({
  selector: 'app-accounts-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './accounts-create.component.html',
  styleUrl: './accounts-create.component.scss',
})
export class AccountsCreateComponent {
  form: FormGroup;
  accountTypes = ACCOUNT_TYPES;
  error = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private router: Router
  ) {
    this.form = this.fb.group({
      description: ['', Validators.required],
      bankName: ['', Validators.required],
      accountType: ['OTHER', Validators.required],
      currency: ['EUR', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    this.error = '';
    this.accountService.create(this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/accounts']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error || 'No se pudo crear la cuenta.';
      },
    });
  }

  goBack(): void {
    this.router.navigate(['../']);
  }
}
