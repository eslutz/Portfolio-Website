import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { TerminalGameComponent } from './terminal-game.component';
import { PythonGameRuntimeService } from '../../shared/services/python-game-runtime.service';

class RuntimeStub {
  readonly loading = signal(false);
  readonly ready = signal(true);
  readonly output = signal(['Welcome to the test game.']);
  readonly prompt = signal('Enter your move =>');
  readonly running = signal(false);
  readonly error = signal<string | null>(null);

  readonly load = jasmine.createSpy('load');
  readonly submit = jasmine.createSpy('submit');
  readonly reset = jasmine.createSpy('reset');
}

describe('TerminalGameComponent', () => {
  let fixture: ComponentFixture<TerminalGameComponent>;
  let runtime: RuntimeStub;

  beforeEach(async () => {
    runtime = new RuntimeStub();

    await TestBed.configureTestingModule({
      imports: [TerminalGameComponent],
      providers: [
        { provide: PythonGameRuntimeService, useValue: runtime },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                title: 'Space Adventure Text Game',
                description: 'A small text-based game set on your ship.',
                gameId: 'space-adventure',
                quickCommands: ['help', 'go Forward'],
                sourceRepoLink:
                  'https://github.com/eslutz/Space-Adventure-Text-Game',
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TerminalGameComponent);
    fixture.detectChanges();
  });

  it('loads the game id from route data and renders the terminal output', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(runtime.load).toHaveBeenCalledOnceWith('space-adventure');
    expect(element.querySelector('h1')?.textContent).toContain(
      'Space Adventure Text Game'
    );
    expect(element.querySelector('.terminal-output')?.textContent).toContain(
      'Welcome to the test game.'
    );
    expect(element.querySelector('.terminal-prompt')?.textContent).toContain(
      'Enter your move =>'
    );
  });

  it('submits typed commands and clears the input', () => {
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('input[name="command"]');
    const submit = element.querySelector<HTMLButtonElement>('button[type="submit"]');

    input!.value = 'help';
    input!.dispatchEvent(new Event('input'));
    submit!.click();
    fixture.detectChanges();

    expect(runtime.submit).toHaveBeenCalledOnceWith('help');
    expect(input!.value).toBe('');
  });

  it('submits quick commands and restarts the game', () => {
    const element = fixture.nativeElement as HTMLElement;
    const quickCommand = element.querySelector<HTMLButtonElement>(
      'button[data-command="go Forward"]'
    );
    const restart = element.querySelector<HTMLButtonElement>(
      'button[data-testid="restart-game"]'
    );

    quickCommand!.click();
    restart!.click();

    expect(runtime.submit).toHaveBeenCalledWith('go Forward');
    expect(runtime.reset).toHaveBeenCalled();
  });

  it('renders runtime errors as alerts', () => {
    runtime.error.set('Runtime failed');
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');

    expect(alert.textContent).toContain('Runtime failed');
  });
});
