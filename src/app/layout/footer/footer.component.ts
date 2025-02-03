import { Component, OnInit } from '@angular/core';
import { Footer } from './footer.interface';
import data from '../../../assets/content.json';


@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
  standalone: false
})
export class FooterComponent implements OnInit {
  footer: Footer = data.footer;
  currentYear: number = new Date().getFullYear();

  ngOnInit(): void {
  }
}
