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
    path: 'games/space-adventure',
    loadComponent: () =>
      import('./features/terminal-game/terminal-game.component').then(
        (m) => m.TerminalGameComponent
      ),
    data: {
      title: 'Space Adventure Text Game',
      description: 'A small text-based game set on your ship.',
      gameId: 'space-adventure',
      sourceRepoLink: 'https://github.com/eslutz/Space-Adventure-Text-Game',
    },
  },
  {
    path: 'games/guessing-game',
    loadComponent: () =>
      import('./features/terminal-game/terminal-game.component').then(
        (m) => m.TerminalGameComponent
      ),
    data: {
      title: 'Guessing Game',
      description: 'A number guessing game with three ways to play.',
      gameId: 'guessing-game',
      sourceRepoLink: 'https://github.com/eslutz/Guessing-Game',
    },
  },
  {
    path: 'cms',
    canActivate: [cmsAuthGuard],
    loadComponent: () =>
      import('./features/cms/cms.component').then((m) => m.CmsComponent),
    data: { title: 'CMS', siteChrome: false },
  },
  {
    path: '**',
    loadComponent: () =>
      import('./layout/error/error.component').then((m) => m.ErrorComponent),
    data: { title: 'Error' },
  },
];
