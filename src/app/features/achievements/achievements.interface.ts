import { Certification } from '../certifications/certification.interface';
import { Education } from '../education/education.interface';
import { WorkRecognition } from '../work-recognition/work-recognition.interface';

export interface Achievements {
  certifications: Certification[];
  education: Education;
  workRecognition: WorkRecognition[];
}
