import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Project } from './project.interface';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectComponent {
  readonly project = input.required<Project>();
}
