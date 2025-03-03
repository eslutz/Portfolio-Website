import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ErrorComponent } from './layout/error/error.component';
import { HomeComponent } from './features/home/home.component';
import { ProjectsComponent } from './features/projects/projects.component';
import { AchievementsComponent } from './features/achievements/achievements.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: { title: 'Home' },
  },
  {
    path: 'projects',
    component: ProjectsComponent,
    data: { title: 'Projects' },
  },
  {
    path: 'achievements',
    component: AchievementsComponent,
    data: { title: 'Achievements' },
  },
  { path: '**', component: ErrorComponent, data: { title: 'Error' } },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
