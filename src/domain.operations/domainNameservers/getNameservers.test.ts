import { given, then, when } from 'test-fns';

describe('getNameservers', () => {
  given('the module', () => {
    when('imported', () => {
      then('exports getNameservers function', async () => {
        const mod = await import('./getNameservers');
        expect(typeof mod.getNameservers).toEqual('function');
      });
    });
  });
});
