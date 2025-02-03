import { Component, Input } from '@angular/core';
import { Project } from './project.interface';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css'],
  standalone: false,
})
export class ProjectComponent {
  @Input() project!: Project;
}
