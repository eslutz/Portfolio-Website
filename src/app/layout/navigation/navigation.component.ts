import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { OutsideClickDirective } from '../../shared/directives/outside-click.directive';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
  imports: [RouterLink, RouterLinkActive, OutsideClickDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent {
  readonly navOpen = signal(false);

  closeMobileNav(): void {
    this.navOpen.set(false);
  }

  toggleMobileNav(): void {
    this.navOpen.update((open) => !open);
  }
}
