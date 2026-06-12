import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';

@Component({
  template: '',
})
class TestRouteComponent {}

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([
          {
            path: 'cms',
            component: TestRouteComponent,
            data: { siteChrome: false },
          },
        ]),
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the navigation and footer', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('app-navigation')).toBeTruthy();
    expect(element.querySelector('app-footer')).toBeTruthy();
  });

  it('hides the public navigation and footer on chrome-free routes', fakeAsync(() => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(AppComponent);

    router.navigateByUrl('/cms');
    tick();
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('app-navigation')).toBeFalsy();
    expect(element.querySelector('app-footer')).toBeFalsy();
  }));
});
