import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.css'],
  standalone: false,
})
export class ErrorComponent {
  countdown: number = 15;

  constructor(private router: Router) {}

  ngOnInit() {
    setInterval(() => {
      this.countdown--;
      if (this.countdown === 0) {
        this.router.navigateByUrl('/');
      }
    }, 1000);
  }
}
