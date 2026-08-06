import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { Project } from '../project/project.interface';
import { ProjectComponent } from '../project/project.component';
import { PortfolioApiService } from '../../shared/services/portfolio-api.service';

interface ProjectsState {
  loading: boolean;
  error: string | null;
  projects: Project[];
}

const galleryDesignerImage = '/assets/images/projects/gallery_designer.png';

export function projectAnchor(project: Pick<Project, 'title'>): string {
  return project.title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizedFragment(fragment: string): string {
  return projectAnchor({ title: fragment });
}

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
  imports: [ProjectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsComponent {
  private readonly portfolioApi = inject(PortfolioApiService);
  private readonly document = inject(DOCUMENT);
  private readonly fragment = toSignal(inject(ActivatedRoute).fragment, {
    initialValue: null,
  });

  readonly state = toSignal(
    this.portfolioApi.getComponentData<Project>('project').pipe(
      map(
        (projects): ProjectsState => ({
          loading: false,
          error: null,
          projects: projects
            .toSorted((a, b) => a.order - b.order)
            .map((project) =>
              projectAnchor(project) === 'gallery-designer'
                ? { ...project, imageSrc: galleryDesignerImage }
                : project
            ),
        })
      ),
      catchError(() =>
        of<ProjectsState>({
          loading: false,
          error: 'Failed to load projects',
          projects: [],
        })
      )
    ),
    { initialValue: { loading: true, error: null, projects: [] } }
  );

  constructor() {
    effect(() => {
      const fragment = this.fragment();
      const projects = this.state().projects;
      const anchor = fragment ? normalizedFragment(fragment) : null;
      if (!anchor || !projects.some((project) => projectAnchor(project) === anchor)) {
        return;
      }

      setTimeout(() => {
        this.document.getElementById(anchor)?.scrollIntoView({
          block: 'start',
        });
      });
    });
  }

  projectAnchor(project: Pick<Project, 'title'>): string {
    return projectAnchor(project);
  }
}
