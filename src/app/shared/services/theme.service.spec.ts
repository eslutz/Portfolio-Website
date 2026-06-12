import { TestBed } from '@angular/core/testing';

import { ThemePreference, ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-cms-theme');

    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-cms-theme');
  });

  it('defaults the CMS preference to system without forcing a theme', () => {
    service.activateCmsTheme();

    expect(service.preference()).toBe('system');
    expect(document.documentElement.getAttribute('data-cms-theme')).toBeNull();
  });

  it('stores and applies an explicit CMS theme preference', () => {
    service.activateCmsTheme();

    service.setPreference('dark');

    expect(service.preference()).toBe('dark');
    expect(localStorage.getItem('portfolio-cms-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-cms-theme')).toBe('dark');
  });

  it('ignores invalid stored CMS theme preferences', () => {
    localStorage.setItem('portfolio-cms-theme', 'sepia');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    service = TestBed.inject(ThemeService);

    expect(service.preference()).toBe('system');
  });

  it('removes the CMS override when deactivated', () => {
    service.activateCmsTheme();
    service.setPreference('light');

    service.deactivateCmsTheme();

    expect(document.documentElement.getAttribute('data-cms-theme')).toBeNull();
  });

  it('allows light, dark, and system preferences', () => {
    const preferences: ThemePreference[] = ['light', 'dark', 'system'];

    preferences.forEach((preference) => service.setPreference(preference));

    expect(service.preference()).toBe('system');
  });
});
