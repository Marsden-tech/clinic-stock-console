import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

interface LoginResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  accessToken: string;
  refreshToken: string;
}

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly baseUrl = 'https://dummyjson.com/auth';
  private http = inject(HttpClient);
  private router = inject(Router);

  isAuthenticated = signal<boolean>(this.hasStoredToken());

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/login`, {
        username,
        password,
        expiresInMins: 1,
      })
      .pipe(
        tap((response) => {
          sessionStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
          sessionStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
          this.isAuthenticated.set(true);
        }),
      );
  }

  logout(): void {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }

  private hasStoredToken(): boolean {
    return !!sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }
}
