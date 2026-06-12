import { TestBed } from '@angular/core/testing';

import {
  PYTHON_GAME_WORKER_FACTORY,
  PythonGameRuntimeService,
  PythonGameWorkerLike,
} from './python-game-runtime.service';

class FakeWorker implements PythonGameWorkerLike {
  readonly messages: unknown[] = [];
  terminated = false;
  private readonly messageListeners: ((event: MessageEvent) => void)[] = [];
  private readonly errorListeners: ((event: ErrorEvent) => void)[] = [];

  postMessage(message: unknown): void {
    this.messages.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  addEventListener(
    type: 'message',
    listener: (event: MessageEvent) => void
  ): void;
  addEventListener(
    type: 'error',
    listener: (event: ErrorEvent) => void
  ): void;
  addEventListener(
    type: 'message' | 'error',
    listener: ((event: MessageEvent) => void) | ((event: ErrorEvent) => void)
  ): void {
    if (type === 'message') {
      this.messageListeners.push(listener as (event: MessageEvent) => void);
    } else {
      this.errorListeners.push(listener as (event: ErrorEvent) => void);
    }
  }

  removeEventListener(
    type: 'message',
    listener: (event: MessageEvent) => void
  ): void;
  removeEventListener(
    type: 'error',
    listener: (event: ErrorEvent) => void
  ): void;
  removeEventListener(
    type: 'message' | 'error',
    listener: ((event: MessageEvent) => void) | ((event: ErrorEvent) => void)
  ): void {
    if (type === 'message') {
      const index = this.messageListeners.indexOf(
        listener as (event: MessageEvent) => void
      );
      if (index >= 0) {
        this.messageListeners.splice(index, 1);
      }
    } else {
      const index = this.errorListeners.indexOf(
        listener as (event: ErrorEvent) => void
      );
      if (index >= 0) {
        this.errorListeners.splice(index, 1);
      }
    }
  }

  dispatchMessage(data: unknown): void {
    const event = { data } as MessageEvent;
    this.messageListeners.forEach((listener) => listener(event));
  }

  dispatchError(message: string): void {
    const event = { message } as ErrorEvent;
    this.errorListeners.forEach((listener) => listener(event));
  }
}

describe('PythonGameRuntimeService', () => {
  let service: PythonGameRuntimeService;
  let fakeWorker: FakeWorker;

  beforeEach(() => {
    fakeWorker = new FakeWorker();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: PYTHON_GAME_WORKER_FACTORY,
          useValue: () => fakeWorker,
        },
      ],
    });

    service = TestBed.inject(PythonGameRuntimeService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('loads a game by posting a load message to the worker', () => {
    service.load('space-adventure');

    expect(service.loading()).toBeTrue();
    expect(fakeWorker.messages).toEqual([
      { type: 'load', gameId: 'space-adventure' },
    ]);
  });

  it('updates state from worker output, prompt, ready, done, and error messages', () => {
    service.load('guessing-game');

    fakeWorker.dispatchMessage({ type: 'output', text: 'Welcome' });
    fakeWorker.dispatchMessage({ type: 'prompt', text: '=> ' });
    fakeWorker.dispatchMessage({ type: 'ready' });

    expect(service.output()).toEqual(['Welcome']);
    expect(service.prompt()).toBe('=> ');
    expect(service.ready()).toBeTrue();
    expect(service.loading()).toBeFalse();

    fakeWorker.dispatchMessage({ type: 'done' });
    expect(service.running()).toBeFalse();

    fakeWorker.dispatchMessage({ type: 'error', message: 'Python failed' });
    expect(service.error()).toBe('Python failed');
    expect(service.ready()).toBeFalse();
  });

  it('posts input and reset messages to the loaded worker', () => {
    service.load('space-adventure');
    fakeWorker.dispatchMessage({ type: 'ready' });

    service.submit('help');
    service.reset();

    expect(fakeWorker.messages).toContain(
      jasmine.objectContaining({ type: 'input', value: 'help' })
    );
    expect(fakeWorker.messages).toContain(jasmine.objectContaining({ type: 'reset' }));
  });

  it('reports worker errors and terminates old workers when loading a new game', () => {
    service.load('space-adventure');
    fakeWorker.dispatchError('Worker crashed');

    expect(service.error()).toBe('Worker crashed');
    expect(service.loading()).toBeFalse();

    const firstWorker = fakeWorker;
    fakeWorker = new FakeWorker();
    service.load('guessing-game');

    expect(firstWorker.terminated).toBeTrue();
    expect(fakeWorker.messages).toEqual([
      { type: 'load', gameId: 'guessing-game' },
    ]);
  });
});
