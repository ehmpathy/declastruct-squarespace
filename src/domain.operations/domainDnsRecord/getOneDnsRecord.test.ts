import { given, then, when } from 'test-fns';

describe('getOneDnsRecord', () => {
  given('the module is loaded', () => {
    when('imported', () => {
      then('exports getOneDnsRecord function', async () => {
        const mod = await import('./getOneDnsRecord');
        expect(typeof mod.getOneDnsRecord).toEqual('function');
      });
    });
  });

  given('getOneDnsRecord function signature', () => {
    when('examined', () => {
      then('accepts input with by.unique', async () => {
        const { getOneDnsRecord } = await import('./getOneDnsRecord');

        // verify the function signature matches expected pattern
        const funcString = getOneDnsRecord.toString();
        expect(funcString).toContain('input');
        expect(funcString).toContain('context');
      });
    });
  });
});
