import { Routes } from '@angular/router';

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
    path: '**',
    loadComponent: () =>
      import('./layout/error/error.component').then((m) => m.ErrorComponent),
    data: { title: 'Error' },
  },
];
