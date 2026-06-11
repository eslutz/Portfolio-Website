import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';

import { Footer } from './footer.interface';
import { PortfolioApiService } from '../../shared/services/portfolio-api.service';

interface FooterState {
  loading: boolean;
  error: string | null;
  footer: Footer | null;
}

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();

  private readonly portfolioApi = inject(PortfolioApiService);

  readonly state = toSignal(
    this.portfolioApi.getComponentData<Footer>('footer').pipe(
      map(([footer]): FooterState => {
        if (!footer) {
          return {
            loading: false,
            error: 'Footer content not found',
            footer: null,
          };
        }
        return { loading: false, error: null, footer };
      }),
      catchError(() =>
        of<FooterState>({
          loading: false,
          error: 'Failed to load footer content',
          footer: null,
        })
      )
    ),
    { initialValue: { loading: true, error: null, footer: null } }
  );
}
