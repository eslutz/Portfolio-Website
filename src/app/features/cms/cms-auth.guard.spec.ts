import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';

import { ClientPrincipal, CmsAuthService } from './cms-auth.service';
import { cmsAuthGuard } from './cms-auth.guard';

describe('cmsAuthGuard', () => {
  function runGuard(): Observable<boolean | UrlTree> {
    return TestBed.runInInjectionContext(
      () => cmsAuthGuard({} as never, {} as never) as Observable<boolean | UrlTree>
    );
  }

  it('allows the GitHub admin through', (done) => {
    const principal: ClientPrincipal = {
      identityProvider: 'github',
      userId: '1',
      userDetails: 'eslutz',
      userRoles: ['authenticated', 'portfolio_admin'],
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: CmsAuthService,
          useValue: {
            loadPrincipal: () => of(principal),
            isAdmin: () => true,
            signIn: jasmine.createSpy('signIn'),
          },
        },
      ],
    });

    runGuard().subscribe((result) => {
      expect(result).toBeTrue();
      done();
    });
  });

  it('redirects an authenticated non-admin user away from the CMS', (done) => {
    const principal: ClientPrincipal = {
      identityProvider: 'github',
      userId: '2',
      userDetails: 'someone-else',
      userRoles: ['authenticated'],
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: CmsAuthService,
          useValue: {
            loadPrincipal: () => of(principal),
            isAdmin: () => false,
            signIn: jasmine.createSpy('signIn'),
          },
        },
      ],
    });

    runGuard().subscribe((result) => {
      expect(result instanceof UrlTree).toBeTrue();
      done();
    });
  });

  it('starts GitHub sign-in when no principal is present', (done) => {
    const signIn = jasmine.createSpy('signIn');

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: CmsAuthService,
          useValue: {
            loadPrincipal: () => of(null),
            isAdmin: () => false,
            signIn,
          },
        },
      ],
    });

    runGuard().subscribe((result) => {
      expect(result).toBeFalse();
      expect(signIn).toHaveBeenCalled();
      done();
    });
  });
});
