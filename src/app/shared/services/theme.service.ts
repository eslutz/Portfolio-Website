import { DOCUMENT, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface ThemeOption {
  value: ThemePreference;
  label: string;
}

const STORAGE_KEY = 'portfolio-cms-theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private cmsThemeActive = false;

  readonly options: ThemeOption[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];
  readonly preference = signal<ThemePreference>(this.readPreference());

  activateCmsTheme(): void {
    this.cmsThemeActive = true;
    this.applyCmsTheme();
  }

  deactivateCmsTheme(): void {
    this.cmsThemeActive = false;
    this.document.documentElement.removeAttribute('data-cms-theme');
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
    this.writePreference(preference);
    this.applyCmsTheme();
  }

  private applyCmsTheme(): void {
    if (!this.cmsThemeActive) {
      return;
    }

    const preference = this.preference();
    if (preference === 'system') {
      this.document.documentElement.removeAttribute('data-cms-theme');
      return;
    }

    this.document.documentElement.setAttribute('data-cms-theme', preference);
  }

  private readPreference(): ThemePreference {
    if (!this.isBrowser) {
      return 'system';
    }

    try {
      const storedPreference = localStorage.getItem(STORAGE_KEY);
      return isThemePreference(storedPreference) ? storedPreference : 'system';
    } catch {
      return 'system';
    }
  }

  private writePreference(preference: ThemePreference): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Local storage can be unavailable in restricted browser contexts.
    }
  }
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}
