import { Component, Input } from '@angular/core';
import { WorkRecognition, RecognitionType } from './work-recognition.interface';

@Component({
  selector: 'app-work-recognition',
  templateUrl: './work-recognition.component.html',
  styleUrls: ['./work-recognition.component.css'],
  standalone: false
})
export class WorkRecognitionComponent {
  @Input() workRecognition!: WorkRecognition;

  protected readonly RecognitionType = RecognitionType;
}
