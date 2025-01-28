import { NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavigationComponent } from './navigation/navigation.component';
import { FooterComponent } from './footer/footer.component';
import { HomeComponent } from './home/home.component';
import { ProjectsComponent } from './projects/projects.component';
import { ProjectComponent } from './project/project.component';
import { RecognitionComponent } from './recognition/recognition.component';
import { ErrorComponent } from './error/error.component';
import { OutsideClickDirective } from './outside-click.directive';

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    FooterComponent,
    HomeComponent,
    ProjectsComponent,
    ProjectComponent,
    RecognitionComponent,
    ErrorComponent,
    OutsideClickDirective,
  ],
  imports: [BrowserModule, AppRoutingModule],
  providers: [Title],
  bootstrap: [AppComponent],
})
export class AppModule {}
