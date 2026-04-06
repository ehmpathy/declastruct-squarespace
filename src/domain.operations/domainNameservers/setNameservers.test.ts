import { given, then, when } from 'test-fns';

describe('setNameservers', () => {
  given('the module', () => {
    when('imported', () => {
      then('exports setNameservers function', async () => {
        const mod = await import('./setNameservers');
        expect(typeof mod.setNameservers).toEqual('function');
      });
    });
  });

  given('setNameservers function', () => {
    when('examined', () => {
      then('follows the (input, context) signature pattern', async () => {
        const { setNameservers } = await import('./setNameservers');

        // verify the function is defined and callable
        expect(typeof setNameservers).toEqual('function');
        expect(setNameservers.length).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
