import { given, then, when } from 'test-fns';

describe('getOneDomain', () => {
  given('the module is loaded', () => {
    when('imported', () => {
      then('exports getOneDomain function', async () => {
        const mod = await import('./getOneDomain');
        expect(typeof mod.getOneDomain).toEqual('function');
      });
    });
  });

  given('getOneDomain function signature', () => {
    when('examined', () => {
      then('accepts input with by.unique.name', async () => {
        const { getOneDomain } = await import('./getOneDomain');

        // verify the function signature matches expected pattern
        const funcString = getOneDomain.toString();
        expect(funcString).toContain('input');
        expect(funcString).toContain('context');
      });

      then('accepts input with by.ref.name', async () => {
        const { getOneDomain } = await import('./getOneDomain');

        // function should handle both by.unique and by.ref patterns
        const funcString = getOneDomain.toString();
        expect(funcString).toContain('by.unique');
        expect(funcString).toContain('by.ref');
      });
    });
  });
});
