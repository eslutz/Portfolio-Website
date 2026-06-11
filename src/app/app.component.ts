import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { FooterComponent } from './layout/footer/footer.component';
import { NavigationComponent } from './layout/navigation/navigation.component';

declare const gtag: (command: string, ...args: unknown[]) => void;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [RouterOutlet, NavigationComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly titleService = inject(Title);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  constructor() {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        takeUntilDestroyed()
      )
      .subscribe((event) => {
        const routeTitle = this.resolveRouteTitle();
        if (routeTitle) {
          this.titleService.setTitle(`Eric Slutz | ${routeTitle}`);
        }
        this.updateCanonicalLink(event.urlAfterRedirects);
        if (typeof gtag !== 'undefined') {
          gtag('config', 'G-9YBST1VWZJ', {
            page_path: event.urlAfterRedirects,
          });
        }
      });
  }

  private resolveRouteTitle(): string {
    let route: ActivatedRoute = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.snapshot.data['title'] ?? '';
  }

  private updateCanonicalLink(url: string): void {
    let canonical = this.document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]'
    );
    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      this.document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `https://www.ericslutz.dev${url}`);
  }
}
