import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, finalize, map, takeUntil } from 'rxjs';
import { Project } from '../project/project.interface';
import { PortfolioApiService } from '../../shared/services/portfolio-api.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
  standalone: false,
})
export class ProjectsComponent implements OnInit, OnDestroy {
  projects: Project[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private portfolioApi: PortfolioApiService) {}

  ngOnInit(): void {
    this.portfolioApi.getComponentData<Project>('project').pipe(
      map(projects => projects.sort((a, b) => a.order - b.order)),
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (sortedProjects) => this.projects = sortedProjects,
      error: (error) => {
        console.error('Error fetching projects data:', error);
        this.error = 'Failed to load projects';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
