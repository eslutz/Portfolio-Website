import { Component, OnInit } from '@angular/core';
import data from 'src/assets/content.json';
import { Project } from '../project/project.interface';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
  standalone: false,
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = data.filter((item) => item.component === 'project') as Project[];

  ngOnInit(): void {
  }
}
