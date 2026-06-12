import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { CmsAuthService } from './cms-auth.service';

describe('CmsAuthService', () => {
  let service: CmsAuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });

    service = TestBed.inject(CmsAuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads the Static Web Apps client principal', () => {
    let userDetails: string | undefined;

    service
      .loadPrincipal()
      .subscribe((principal) => (userDetails = principal?.userDetails));

    const req = httpMock.expectOne('/.auth/me');
    expect(req.request.method).toBe('GET');
    req.flush({
      clientPrincipal: {
        identityProvider: 'github',
        userId: '123',
        userDetails: 'eslutz',
        userRoles: ['authenticated', 'portfolio_admin'],
      },
    });

    expect(userDetails).toBe('eslutz');
    expect(service.principal()?.userDetails).toBe('eslutz');
  });

  it('requires GitHub identity, eslutz user, and portfolio_admin role', () => {
    expect(
      service.isAdmin({
        identityProvider: 'github',
        userId: '123',
        userDetails: 'eslutz',
        userRoles: ['authenticated', 'portfolio_admin'],
      })
    ).toBeTrue();

    expect(
      service.isAdmin({
        identityProvider: 'github',
        userId: '456',
        userDetails: 'someone-else',
        userRoles: ['authenticated', 'portfolio_admin'],
      })
    ).toBeFalse();

    expect(
      service.isAdmin({
        identityProvider: 'github',
        userId: '123',
        userDetails: 'eslutz',
        userRoles: ['authenticated'],
      })
    ).toBeFalse();
  });
});
