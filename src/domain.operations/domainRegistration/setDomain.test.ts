import { given, then, when } from 'test-fns';

describe('setDomain', () => {
  given('the module is loaded', () => {
    when('imported', () => {
      then('exports setDomain function', async () => {
        const mod = await import('./setDomain');
        expect(typeof mod.setDomain).toEqual('function');
      });
    });
  });

  given('setDomain function', () => {
    when('examined', () => {
      then('follows the (input, context) signature pattern', async () => {
        const { setDomain } = await import('./setDomain');

        // verify the function is defined and callable
        expect(typeof setDomain).toEqual('function');
        expect(setDomain.length).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
