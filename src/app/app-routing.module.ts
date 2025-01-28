import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ErrorComponent } from './error/error.component';
import { HomeComponent } from './home/home.component';
import { ProjectsComponent } from './projects/projects.component';
import { AchievementsComponent } from './achievements/achievements.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, data: { title: 'Portfolio' } },
  {
    path: 'achievements',
    component: AchievementsComponent,
    data: { title: 'Achievements' },
  },
  {
    path: 'projects',
    component: ProjectsComponent,
    data: { title: 'Projects' },
  },
  { path: '**', component: ErrorComponent, data: { title: 'Error' } },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
