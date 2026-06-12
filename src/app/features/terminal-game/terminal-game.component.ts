import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { PythonGameRuntimeService } from '../../shared/services/python-game-runtime.service';

interface TerminalGameRouteData {
  title: string;
  description: string;
  gameId: string;
  quickCommands: string[];
  sourceRepoLink: string;
}

@Component({
  selector: 'app-terminal-game',
  templateUrl: './terminal-game.component.html',
  styleUrls: ['./terminal-game.component.css'],
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerminalGameComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly runtime = inject(PythonGameRuntimeService);

  readonly command = new FormControl({ value: '', disabled: true }, { nonNullable: true });
  readonly game = this.route.snapshot.data as TerminalGameRouteData;

  constructor() {
    this.runtime.load(this.game.gameId);

    effect(() => {
      if (this.runtime.ready()) {
        this.command.enable({ emitEvent: false });
      } else {
        this.command.disable({ emitEvent: false });
      }
    });

    this.command.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value.includes('\n')) {
          this.command.setValue(value.replace(/\n/g, ''), { emitEvent: false });
        }
      });
  }

  submitCommand(): void {
    const value = this.command.value.trim();
    if (!value) {
      return;
    }

    this.runtime.submit(value);
    this.command.setValue('');
  }

  submitQuickCommand(command: string): void {
    this.runtime.submit(command);
  }

  restart(): void {
    this.command.setValue('');
    this.runtime.reset();
  }
}
