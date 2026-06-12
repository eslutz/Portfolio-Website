import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { of } from 'rxjs';

import { CmsApiService } from './cms-api.service';
import { CmsAuthService } from './cms-auth.service';
import { CmsComponent } from './cms.component';
import { PortfolioApiService } from '../../shared/services/portfolio-api.service';
import { RecognitionType } from '../work-recognition/work-recognition.interface';
import { ThemeService } from '../../shared/services/theme.service';

describe('CmsComponent', () => {
  let fixture: ComponentFixture<CmsComponent>;
  let meta: Meta;
  let themeService: ThemeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CmsComponent],
      providers: [
        {
          provide: CmsAuthService,
          useValue: {
            principal: () => ({
              identityProvider: 'github',
              userId: '123',
              userDetails: 'eslutz',
              userRoles: ['authenticated', 'portfolio_admin'],
            }),
            loadPrincipal: () =>
              of({
                identityProvider: 'github',
                userId: '123',
                userDetails: 'eslutz',
                userRoles: ['authenticated', 'portfolio_admin'],
              }),
            signOut: () => undefined,
          },
        },
        {
          provide: CmsApiService,
          useValue: {
            getComponent: (component: string) => {
              const content: Record<string, unknown[]> = {
                home: [
                  {
                    id: 'home',
                    component: 'home',
                    title: 'Home',
                    content: 'Content',
                  },
                ],
                project: [],
                education: [
                  {
                    id: 'education',
                    component: 'education',
                    degrees: [],
                    honors: {
                      societies: { title: 'Society', description: 'Details' },
                      lists: { list: [], link: { title: 'Link', description: 'Details' } },
                    },
                  },
                ],
                certification: [],
                recognition: [
                  {
                    id: 'recognition',
                    component: 'recognition',
                    companies: [
                      {
                        company: 'Company',
                        description: 'Company',
                        recognition: [{ type: RecognitionType.Text }],
                      },
                    ],
                  },
                ],
              };
              return of(content[component] ?? []);
            },
          },
        },
        {
          provide: PortfolioApiService,
          useValue: { clearCache: () => undefined },
        },
      ],
    }).compileComponents();

    meta = TestBed.inject(Meta);
    themeService = TestBed.inject(ThemeService);
    fixture = TestBed.createComponent(CmsComponent);
  });

  it('sets the robots meta tag to noindex while active', () => {
    fixture.detectChanges();

    expect(meta.getTag('name="robots"')?.content).toBe(
      'noindex,nofollow,noarchive'
    );
  });

  it('activates the CMS theme controls while active', () => {
    spyOn(themeService, 'activateCmsTheme').and.callThrough();

    fixture.detectChanges();

    expect(themeService.activateCmsTheme).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#cms-theme')).toBeTruthy();
  });

  it('updates the CMS theme from the theme selector', () => {
    fixture.detectChanges();

    const select = (fixture.nativeElement as HTMLElement).querySelector(
      '#cms-theme'
    ) as HTMLSelectElement;
    select.value = 'dark';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(themeService.preference()).toBe('dark');
    expect(document.documentElement.getAttribute('data-cms-theme')).toBe('dark');
  });
});
