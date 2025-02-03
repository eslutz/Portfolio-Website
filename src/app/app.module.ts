import { NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AchievementsComponent } from './features/achievements/achievements.component';
import { CertificationsComponent } from './features/certifications/certifications.component';
import { EducationComponent } from './features/education/education.component';
import { ErrorComponent } from './layout/error/error.component';
import { FooterComponent } from './layout/footer/footer.component';
import { HomeComponent } from './features/home/home.component';
import { NavigationComponent } from './layout/navigation/navigation.component';
import { OutsideClickDirective } from './shared/directives/outside-click.directive';
import { ProjectComponent } from './features/project/project.component';
import { ProjectsComponent } from './features/projects/projects.component';
import { WorkRecognitionComponent } from './features/work-recognition/work-recognition.component';

@NgModule({
  declarations: [
    AppComponent,
    AchievementsComponent,
    CertificationsComponent,
    EducationComponent,
    ErrorComponent,
    FooterComponent,
    HomeComponent,
    NavigationComponent,
    OutsideClickDirective,
    ProjectComponent,
    ProjectsComponent,
    WorkRecognitionComponent,
  ],
  imports: [BrowserModule, AppRoutingModule],
  providers: [Title],
  bootstrap: [AppComponent],
})
export class AppModule {}
