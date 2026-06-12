import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { of } from 'rxjs';

import { CmsApiService } from './cms-api.service';
import { CmsAuthService } from './cms-auth.service';
import { CmsComponent } from './cms.component';
import { PortfolioApiService } from '../../shared/services/portfolio-api.service';
import { RecognitionType } from '../work-recognition/work-recognition.interface';

describe('CmsComponent', () => {
  let fixture: ComponentFixture<CmsComponent>;
  let meta: Meta;

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
    fixture = TestBed.createComponent(CmsComponent);
  });

  it('sets the robots meta tag to noindex while active', () => {
    fixture.detectChanges();

    expect(meta.getTag('name="robots"')?.content).toBe(
      'noindex,nofollow,noarchive'
    );
  });
});
