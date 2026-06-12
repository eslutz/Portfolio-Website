import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { HomeComponent } from './home.component';
import { PortfolioApiService } from '../../shared/services/portfolio-api.service';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        {
          provide: PortfolioApiService,
          useValue: {
            getComponentData: () =>
              of([
                {
                  id: 'home',
                  component: 'home',
                  title: 'Eric Slutz',
                  subtitle: 'Software Engineer building cloud-native systems.',
                  content:
                    '<p>Software Engineer building cloud-native systems.</p><h2>Current Focus</h2><h3>Enterprise Software Engineering</h3><p>Details</p>',
                },
              ]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
  });

  it('renders the hero subtitle and removes the duplicate lead paragraph from body content', () => {
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Eric Slutz');
    expect(element.querySelector('.home-subtitle')?.textContent).toContain(
      'Software Engineer building cloud-native systems.'
    );
    expect(element.querySelector('.heading-secondary')).toBeNull();
    expect(element.querySelector('.home-content')?.textContent).not.toContain(
      'Software Engineer building cloud-native systems.'
    );
    expect(element.querySelector('.home-content h2')?.textContent).toContain(
      'Current Focus'
    );
    expect(element.querySelector('.home-content h3')?.textContent).toContain(
      'Enterprise Software Engineering'
    );
  });
});
