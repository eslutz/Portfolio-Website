import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';

import { Project } from '../project/project.interface';
import { ProjectComponent } from '../project/project.component';
import { PortfolioApiService } from '../../shared/services/portfolio-api.service';

interface ProjectsState {
  loading: boolean;
  error: string | null;
  projects: Project[];
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

  readonly state = toSignal(
    this.portfolioApi.getComponentData<Project>('project').pipe(
      map(
        (projects): ProjectsState => ({
          loading: false,
          error: null,
          projects: projects.toSorted((a, b) => a.order - b.order),
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
}
