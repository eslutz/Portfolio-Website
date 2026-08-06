import { projectAnchor } from './projects.component';

describe('projectAnchor', () => {
  it('creates URL-safe anchors from project titles', () => {
    expect(projectAnchor({ title: 'MyReads' })).toBe('myreads');
    expect(projectAnchor({ title: 'PumpSync' })).toBe('pumpsync');
    expect(projectAnchor({ title: 'A Playa Named Gus' })).toBe('a-playa-named-gus');
  });
});
