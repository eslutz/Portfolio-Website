import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { ErrorComponent } from './error.component';

describe('ErrorComponent', () => {
  let fixture: ComponentFixture<ErrorComponent>;

  beforeEach(async () => {
    jasmine.clock().install();

    await TestBed.configureTestingModule({
      imports: [ErrorComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorComponent);
  });

  afterEach(() => {
    fixture.destroy();
    jasmine.clock().uninstall();
  });

  it('counts down once per second', () => {
    fixture.detectChanges();

    expect(fixture.componentInstance.countdown()).toBe(15);
    jasmine.clock().tick(3000);
    expect(fixture.componentInstance.countdown()).toBe(12);
  });

  it('navigates home and stops when the countdown reaches zero', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigateByUrl');
    fixture.detectChanges();

    jasmine.clock().tick(15000);
    expect(fixture.componentInstance.countdown()).toBe(0);
    expect(navigateSpy).toHaveBeenCalledWith('/');

    jasmine.clock().tick(5000);
    expect(fixture.componentInstance.countdown()).toBe(0);
  });

  it('clears its interval on destroy', () => {
    fixture.detectChanges();

    jasmine.clock().tick(2000);
    expect(fixture.componentInstance.countdown()).toBe(13);

    fixture.destroy();

    jasmine.clock().tick(10000);
    expect(fixture.componentInstance.countdown()).toBe(13);
  });
});
