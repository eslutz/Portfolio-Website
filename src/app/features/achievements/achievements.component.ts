import { Component, OnInit } from '@angular/core';
import { Achievements } from './achievements.interface';
import achievementsData from './recognition.json';

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.css'],
  standalone: false,
})
export class AchievementsComponent implements OnInit {
  achievements: Achievements = achievementsData as Achievements;

  ngOnInit(): void {
  }
}
