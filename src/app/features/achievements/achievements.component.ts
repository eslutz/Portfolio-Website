import { Component, OnInit } from '@angular/core';
import data from '../../../assets/content.json';

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.css'],
  standalone: false,
})
export class AchievementsComponent implements OnInit {
  education = data.education;
  certifications = data.certifications;
  recognition = data.workRecognition;

  ngOnInit(): void {
  }
}
