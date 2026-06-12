import { Injectable, InjectionToken, OnDestroy, inject, signal } from '@angular/core';

export type PythonGameWorkerMessage =
  | { type: 'load'; gameId: string }
  | { type: 'input'; value: string }
  | { type: 'reset' };

export type PythonGameRuntimeMessage =
  | { type: 'ready' }
  | { type: 'output'; text: string }
  | { type: 'prompt'; text: string }
  | { type: 'error'; message: string }
  | { type: 'done' };

export interface PythonGameWorkerLike {
  postMessage(message: PythonGameWorkerMessage): void;
  terminate(): void;
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  addEventListener(type: 'error', listener: (event: ErrorEvent) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  removeEventListener(type: 'error', listener: (event: ErrorEvent) => void): void;
}

export const PYTHON_GAME_WORKER_FACTORY = new InjectionToken<
  () => PythonGameWorkerLike
>('PYTHON_GAME_WORKER_FACTORY', {
  providedIn: 'root',
  factory: () => () =>
    new Worker('/assets/workers/python-game.worker.js', { type: 'module' }),
});

@Injectable({
  providedIn: 'root',
})
export class PythonGameRuntimeService implements OnDestroy {
  private readonly workerFactory = inject(PYTHON_GAME_WORKER_FACTORY);
  private worker: PythonGameWorkerLike | null = null;
  private currentGameId: string | null = null;

  readonly loading = signal(false);
  readonly ready = signal(false);
  readonly output = signal<string[]>([]);
  readonly prompt = signal('');
  readonly running = signal(false);
  readonly error = signal<string | null>(null);

  load(gameId: string): void {
    this.disposeWorker();
    this.currentGameId = gameId;
    this.output.set([]);
    this.prompt.set('');
    this.error.set(null);
    this.ready.set(false);
    this.running.set(false);
    this.loading.set(true);

    this.worker = this.workerFactory();
    this.worker.addEventListener('message', this.handleMessage);
    this.worker.addEventListener('error', this.handleWorkerError);
    this.worker.postMessage({ type: 'load', gameId });
  }

  submit(value: string): void {
    const command = value.trim();
    if (!this.worker || !command || !this.ready()) {
      return;
    }

    this.output.update((entries) => [...entries, `${this.prompt()} ${command}`.trim()]);
    this.error.set(null);
    this.ready.set(false);
    this.running.set(true);
    this.worker.postMessage({ type: 'input', value: command });
  }

  reset(): void {
    if (!this.worker) {
      if (this.currentGameId) {
        this.load(this.currentGameId);
      }
      return;
    }

    this.output.set([]);
    this.prompt.set('');
    this.error.set(null);
    this.ready.set(false);
    this.running.set(false);
    this.loading.set(true);
    this.worker.postMessage({ type: 'reset' });
  }

  ngOnDestroy(): void {
    this.disposeWorker();
  }

  private readonly handleMessage = (event: MessageEvent): void => {
    const message = event.data as PythonGameRuntimeMessage;

    switch (message.type) {
      case 'ready':
        this.loading.set(false);
        this.running.set(false);
        this.ready.set(true);
        break;
      case 'output':
        this.output.update((entries) => [...entries, message.text]);
        break;
      case 'prompt':
        this.prompt.set(message.text);
        break;
      case 'done':
        this.loading.set(false);
        this.running.set(false);
        this.ready.set(false);
        break;
      case 'error':
        this.error.set(message.message);
        this.loading.set(false);
        this.running.set(false);
        this.ready.set(false);
        break;
    }
  };

  private readonly handleWorkerError = (event: ErrorEvent): void => {
    this.error.set(event.message || 'Python worker failed');
    this.loading.set(false);
    this.running.set(false);
    this.ready.set(false);
  };

  private disposeWorker(): void {
    if (!this.worker) {
      return;
    }

    this.worker.removeEventListener('message', this.handleMessage);
    this.worker.removeEventListener('error', this.handleWorkerError);
    this.worker.terminate();
    this.worker = null;
  }
}
