import { Component, OnInit } from '@angular/core';
import data from 'src/assets/content.json';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
  standalone: false,
})
export class ProjectsComponent implements OnInit {
  projects = data.projects;

  ngOnInit(): void {
  }
}
