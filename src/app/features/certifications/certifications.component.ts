import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Certification } from './certification.interface';

@Component({
  selector: 'app-certifications',
  templateUrl: './certifications.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificationsComponent {
  readonly certifications = input.required<Certification[]>();
}
