import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { Education } from './education.interface';

@Component({
  selector: 'app-education',
  templateUrl: './education.component.html',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EducationComponent {
  readonly education = input.required<Education>();
}
