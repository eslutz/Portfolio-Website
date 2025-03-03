import { Component, HostListener } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs';

declare const gtag: Function;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false,
})
export class AppComponent {
  title = 'Portfolio';
  makeItStick: boolean = false;
  mobileNav: boolean = false;

  constructor(private titleService: Title, private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route: ActivatedRoute = this.router.routerState.root;
          let routeTitle = '';
          while (route!.firstChild) {
            route = route.firstChild;
          }
          if (route.snapshot.data['title']) {
            routeTitle = route!.snapshot.data['title'];
          }
          return routeTitle;
        })
      )
      .subscribe((title: string) => {
        if (title) {
          this.titleService.setTitle(`Eric Slutz | ${title}`);
        }
      });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        gtag('config', 'G-9YBST1VWZJ', { page_path: event.urlAfterRedirects });
      }
    });
  }

  @HostListener('window:scroll', ['$event'])
  checkScroll() {
    this.makeItStick = window.pageYOffset > 82;
  }

  @HostListener('window:resize', ['$event'])
  checkSize() {
    this.mobileNav = window.innerWidth <= 1082;
    console.log(window.innerWidth);
    console.log(this.mobileNav);
  }
}
