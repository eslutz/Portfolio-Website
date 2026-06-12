import { routes } from './app.routes';

describe('routes', () => {
  it('registers the Space Adventure game route with terminal route data', () => {
    const route = routes.find((candidate) => candidate.path === 'games/space-adventure');

    expect(route).toBeTruthy();
    expect(route?.data?.['title']).toBe('Space Adventure Text Game');
    expect(route?.data?.['gameId']).toBe('space-adventure');
    expect(route?.data?.['quickCommands']).toBeUndefined();
    expect(route?.data?.['sourceRepoLink']).toContain(
      'Space-Adventure-Text-Game'
    );
  });

  it('registers the Guessing Game route with terminal route data', () => {
    const route = routes.find((candidate) => candidate.path === 'games/guessing-game');

    expect(route).toBeTruthy();
    expect(route?.data?.['title']).toBe('Guessing Game');
    expect(route?.data?.['gameId']).toBe('guessing-game');
    expect(route?.data?.['quickCommands']).toBeUndefined();
    expect(route?.data?.['sourceRepoLink']).toContain('Guessing-Game');
  });
});
