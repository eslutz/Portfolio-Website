import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';

import { Home } from './home.interface';
import { PortfolioApiService } from '../../shared/services/portfolio-api.service';

interface HomeState {
  loading: boolean;
  error: string | null;
  home: Home | null;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly portfolioApi = inject(PortfolioApiService);

  readonly state = toSignal(
    this.portfolioApi.getComponentData<Home>('home').pipe(
      map(([home]): HomeState => {
        if (!home) {
          return {
            loading: false,
            error: 'Home content not found',
            home: null,
          };
        }
        return { loading: false, error: null, home };
      }),
      catchError(() =>
        of<HomeState>({
          loading: false,
          error: 'Failed to load home content',
          home: null,
        })
      )
    ),
    { initialValue: { loading: true, error: null, home: null } }
  );
}
