import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, User } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private readonly tokenKey = 'auth_token';
  private readonly userKey = 'current_user';

  public currentUser = signal<User | null>(null);
  public isAuthenticated = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredAuth();
  }

  public login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.storeToken(response.access_token);
          this.loadUserInfo();
        })
      );
  }

  public logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);

    this.currentUser.set(null);
    this.isAuthenticated.set(false);

    void this.router.navigate(['/login']);
  }

  public loadUserInfo(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/user`)
      .pipe(
        tap(user => {
          this.storeUserInfo(user);
          this.currentUser.set(user);
          this.isAuthenticated.set(true);
        })
      );
  }

  public getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private storeToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private storeUserInfo(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  private loadStoredAuth(): void {
    const token = this.getToken();
    const userJson = localStorage.getItem(this.userKey);

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      } catch (e) {
        this.logout();
      }
    }
  }
}
