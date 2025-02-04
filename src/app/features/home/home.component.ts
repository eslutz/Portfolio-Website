import { Component, OnInit } from '@angular/core';
import { Home } from './home.interface';
import data from '../../../assets/content.json';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false,
})
export class HomeComponent {
  home: Home = data.find((item) => item.component === 'home') as Home;

  ngOnInit(): void {}
}
