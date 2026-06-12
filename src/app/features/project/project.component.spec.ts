import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ProjectComponent } from './project.component';
import { Project } from './project.interface';

const baseProject: Project = {
  id: 'space-adventure',
  component: 'project',
  order: 1,
  title: 'Space Adventure Text Game',
  description: 'A small text-based game set on your ship.',
  demoLink: '/games/space-adventure',
  demoLinkText: 'Play Game',
  codeLink: 'https://github.com/eslutz/Space-Adventure-Text-Game',
};

describe('ProjectComponent', () => {
  let fixture: ComponentFixture<ProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectComponent);
  });

  it('renders internal game demo links without opening a new tab', () => {
    fixture.componentRef.setInput('project', baseProject);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const demoLink = element.querySelector<HTMLAnchorElement>(
      'a.link[href="/games/space-adventure"]'
    );

    expect(demoLink).toBeTruthy();
    expect(demoLink?.textContent).toContain('Play Game');
    expect(demoLink?.getAttribute('target')).toBeNull();
    expect(demoLink?.getAttribute('rel')).toBeNull();
  });

  it('keeps external demo links opening in a new tab', () => {
    fixture.componentRef.setInput('project', {
      ...baseProject,
      demoLink: 'https://example.com/demo',
    });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const demoLink = element.querySelector<HTMLAnchorElement>(
      'a.link[href="https://example.com/demo"]'
    );

    expect(demoLink).toBeTruthy();
    expect(demoLink?.getAttribute('target')).toBe('_blank');
    expect(demoLink?.getAttribute('rel')).toContain('noopener');
  });
});
