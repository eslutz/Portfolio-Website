import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';

import { Home } from './home.interface';
import { PortfolioApiService } from '../../shared/services/portfolio-api.service';

interface HomeState {
  loading: boolean;
  error: string | null;
  home: HomeViewModel | null;
}

interface HomeViewModel extends Home {
  subtitle: string | null;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
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
        return { loading: false, error: null, home: this.toViewModel(home) };
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

  private toViewModel(home: Home): HomeViewModel {
    const subtitle = home.subtitle?.trim() || null;
    return {
      ...home,
      subtitle,
      content: subtitle
        ? this.removeDuplicateLeadParagraph(home.content, subtitle)
        : home.content,
    };
  }

  private removeDuplicateLeadParagraph(content: string, subtitle: string): string {
    const escapedSubtitle = this.escapeRegExp(subtitle);
    const patterns = [
      new RegExp(`^\\s*<p>\\s*${escapedSubtitle}\\s*</p>\\s*`, 'i'),
      new RegExp(
        `^\\s*${escapedSubtitle}\\s*(?:<br\\s*/?>\\s*){2}`,
        'i'
      ),
    ];

    for (const pattern of patterns) {
      if (pattern.test(content)) {
        return content.replace(pattern, '').trim();
      }
    }

    return content;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
