import { Component } from '@angular/core';

@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.css'],
    standalone: false
})
export class NavigationComponent {

  outsideMobileNavClick(hasClickedOutside: any) {
    if (hasClickedOutside) {
      const navMenu = document.querySelector('.nav-container');

      navMenu?.classList.remove('nav-open');
    }
  }

  mobileNavClick() {
    const navMenu = document.querySelector('.nav-container');

    navMenu?.classList.toggle('nav-open');
  }
}
