import { Routes } from '@angular/router';

import { cmsAuthGuard } from './features/cms/cms-auth.guard';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: { title: 'Home' },
  },
  {
    path: 'projects',
    loadComponent: () =>
      import('./features/projects/projects.component').then(
        (m) => m.ProjectsComponent
      ),
    data: { title: 'Projects' },
  },
  {
    path: 'achievements',
    loadComponent: () =>
      import('./features/achievements/achievements.component').then(
        (m) => m.AchievementsComponent
      ),
    data: { title: 'Achievements' },
  },
  {
    path: 'cms',
    canActivate: [cmsAuthGuard],
    loadComponent: () =>
      import('./features/cms/cms.component').then((m) => m.CmsComponent),
    data: { title: 'CMS' },
  },
  {
    path: '**',
    loadComponent: () =>
      import('./layout/error/error.component').then((m) => m.ErrorComponent),
    data: { title: 'Error' },
  },
];
