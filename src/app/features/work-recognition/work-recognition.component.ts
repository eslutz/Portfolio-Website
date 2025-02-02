import { Component, Input } from '@angular/core';
import { WorkRecognition, RecognitionType } from './work-recognition.interface';

@Component({
  selector: 'app-work-recognition',
  templateUrl: './work-recognition.component.html',
  styleUrls: ['./work-recognition.component.css'],
  standalone: false
})
export class WorkRecognitionComponent {
  @Input() set workRecognition(value: any[]) {
    this._workRecognition = value.map(company => ({
      ...company,
      recognition: company.recognition.map((r: any) => ({
        ...r,
        type: r.type as RecognitionType
      }))
    }));
  }
  get workRecognition(): WorkRecognition[] {
    return this._workRecognition;
  }

  private _workRecognition: WorkRecognition[] = [];
  protected readonly RecognitionType = RecognitionType;
}
