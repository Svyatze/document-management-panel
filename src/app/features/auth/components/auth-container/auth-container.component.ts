import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-auth-container',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    MatTabsModule,
    MatCardModule
  ],
  templateUrl: './auth-container.component.html',
  styleUrl: './auth-container.component.scss',
})
export class AuthContainerComponent {
  private router = inject(Router)

  public navigateToTab(tabIndex: number): void {
    const route = tabIndex === 0 ? '/auth/login' : '/auth/register';
    void this.router.navigate([route]);
  }

  public get activeTabIndex(): number {
    return this.router.url.includes('/auth/register') ? 1 : 0;
  }

}
