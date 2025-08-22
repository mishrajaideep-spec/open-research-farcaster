import { routeAgent } from './router';

describe('routeAgent Farcaster detection', () => {
  it('identifies FID prefixed queries regardless of case', () => {
    const result = routeAgent('FID 12345');
    expect(result.agent).toBe('farcaster');
  });

  it('identifies numeric-only queries as Farcaster', () => {
    const result = routeAgent('12345');
    expect(result.agent).toBe('farcaster');
  });

  it('identifies Farcaster keyword regardless of case', () => {
    const result = routeAgent('FARCASTER user');
    expect(result.agent).toBe('farcaster');
  });
});
