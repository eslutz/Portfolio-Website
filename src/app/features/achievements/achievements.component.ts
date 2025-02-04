import { Component, OnInit } from '@angular/core';
import data from '../../../assets/content.json';
import { Certification } from '../certifications/certification.interface';
import { Education } from '../education/education.interface';
import { WorkRecognition } from '../work-recognition/work-recognition.interface';

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.css'],
  standalone: false,
})
export class AchievementsComponent implements OnInit {
  education = data.find((item) => item.component === 'education') as Education;
  certifications = data.filter((item) => item.component === 'certification') as Certification[];
  recognition = data.find((item) => item.component === 'recognition') as WorkRecognition;

  ngOnInit(): void {
  }
}
