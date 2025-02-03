import { Component, Input } from '@angular/core';
import { Certification } from './certification.interface';

@Component({
  selector: 'app-certifications',
  templateUrl: './certifications.component.html',
  styleUrls: ['./certifications.component.css'],
  standalone: false,
})
export class CertificationsComponent {
  @Input() certifications!: Certification[];
}
