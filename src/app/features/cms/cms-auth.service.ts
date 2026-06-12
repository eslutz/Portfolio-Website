import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

export interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
}

interface StaticWebAppsAuthResponse {
  clientPrincipal: ClientPrincipal | null;
}

@Injectable({
  providedIn: 'root',
})
export class CmsAuthService {
  private readonly adminGitHubUsername = 'eslutz';
  private readonly adminRole = 'portfolio_admin';
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);

  readonly principal = signal<ClientPrincipal | null>(null);

  loadPrincipal(): Observable<ClientPrincipal | null> {
    return this.http.get<StaticWebAppsAuthResponse>('/.auth/me').pipe(
      map((response) => response.clientPrincipal),
      tap((principal) => this.principal.set(principal))
    );
  }

  isAdmin(principal: ClientPrincipal | null): boolean {
    return (
      principal?.identityProvider?.toLowerCase() === 'github' &&
      principal.userDetails?.toLowerCase() === this.adminGitHubUsername &&
      principal.userRoles.some(
        (role) => role.toLowerCase() === this.adminRole
      )
    );
  }

  signIn(): void {
    this.document.defaultView?.location.assign(
      '/.auth/login/github?post_login_redirect_uri=/cms'
    );
  }

  signOut(): void {
    this.document.defaultView?.location.assign(
      '/.auth/logout?post_logout_redirect_uri=/'
    );
  }
}
