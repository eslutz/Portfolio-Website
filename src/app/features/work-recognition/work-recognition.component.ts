import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { WorkRecognition, RecognitionType } from './work-recognition.interface';

@Component({
  selector: 'app-work-recognition',
  templateUrl: './work-recognition.component.html',
  styleUrls: ['./work-recognition.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkRecognitionComponent {
  readonly workRecognition = input.required<WorkRecognition>();

  protected readonly RecognitionType = RecognitionType;
}
