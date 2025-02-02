import { Component, OnInit } from '@angular/core';
import projectsData from './projects.json';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
  standalone: false,
})
export class ProjectsComponent implements OnInit {
  projects = projectsData;

  ngOnInit(): void {
  }
}
