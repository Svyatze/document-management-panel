import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components').then(m => m.AuthContainerComponent),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./components').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./components').then(m => m.RegisterComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  }
];
