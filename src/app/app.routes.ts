import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login/login').then((m) => m.Login),
  },
  {
    path: 'items',
    canActivate: [authGuard],
    loadComponent: () => import('./features/item-list/item-list/item-list').then((m) => m.ItemList),
  },
  {
    path: 'items/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/item-detail/item-detail/item-detail').then((m) => m.ItemDetail),
  },
  { path: '', redirectTo: 'items', pathMatch: 'full' },
  { path: '**', redirectTo: 'items' },
];
