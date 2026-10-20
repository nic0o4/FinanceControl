import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'accounts',
        loadComponent: () =>
          import('./features/accounts/accounts-list/accounts-list.component').then(
            (m) => m.AccountsListComponent
          ),
      },
      {
        path: 'accounts/create',
        loadComponent: () =>
          import('./features/accounts/accounts-create/accounts-create.component').then(
            (m) => m.AccountsCreateComponent
          ),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories-list/categories-list.component').then(
            (m) => m.CategoriesListComponent
          ),
      },
      {
        path: 'categories/create',
        loadComponent: () =>
          import('./features/categories/categories-create/categories-create.component').then(
            (m) => m.CategoriesCreateComponent
          ),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/transactions/transactions-list/transactions-list.component').then(
            (m) => m.TransactionsListComponent
          ),
      },
      {
        path: 'classification-rules',
        loadComponent: () =>
          import('./features/classification-rules/classification-rules-list/classification-rules-list.component').then(
            (m) => m.ClassificationRulesListComponent
          ),
      },
      {
        path: 'classification-rules/create',
        loadComponent: () =>
          import('./features/classification-rules/classification-rules-create/classification-rules-create.component').then(
            (m) => m.ClassificationRulesCreateComponent
          ),
      },
      {
        path: 'import',
        loadComponent: () =>
          import('./features/import/import-upload/import-upload.component').then(
            (m) => m.ImportUploadComponent
          ),
      },
      {
        path: 'import/history',
        loadComponent: () =>
          import('./features/import/import-history/import-history.component').then(
            (m) => m.ImportHistoryComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
