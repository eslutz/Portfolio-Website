import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.css'],
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorComponent implements OnInit, OnDestroy {
  readonly countdown = signal(15);

  private readonly router = inject(Router);
  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.countdown.update((value) => value - 1);
      if (this.countdown() === 0) {
        this.clearCountdown();
        this.router.navigateByUrl('/');
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  private clearCountdown(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}
