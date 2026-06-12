import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { inject } from '@angular/core';

import { CmsAuthService } from './cms-auth.service';

export const cmsAuthGuard: CanActivateFn = () => {
  const auth = inject(CmsAuthService);
  const router = inject(Router);

  return auth.loadPrincipal().pipe(
    map((principal) => {
      if (auth.isAdmin(principal)) {
        return true;
      }

      if (principal) {
        return router.parseUrl('/');
      }

      auth.signIn();
      return false;
    }),
    catchError(() => {
      auth.signIn();
      return of(false);
    })
  );
};
