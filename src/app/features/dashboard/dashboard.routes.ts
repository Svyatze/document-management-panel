import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards';
import { UserRole } from '../../models';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components').then(m => m.DashboardHomeComponent),
    children: [
      {
        path: '',
        redirectTo: 'documents',
        pathMatch: 'full'
      },
      {
        path: 'documents',
        loadComponent: () => import('../document').then(m => m.DocumentListComponent)
      },
      {
        path: 'documents/new',
        loadComponent: () => import('../document').then(m => m.DocumentFormComponent),
        canActivate: [roleGuard],
        data: { roles: [UserRole.USER] }
      },
      {
        path: 'documents/:id/edit',
        loadComponent: () => import('../document').then(m => m.DocumentFormComponent),
        canActivate: [roleGuard],
        data: { roles: [UserRole.USER] }
      },
      {
        path: 'documents/:id/view',
        loadComponent: () => import('../document').then(m => m.DocumentViewerComponent)
      }
    ]
  }
];
