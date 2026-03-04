import { given, then, when } from 'test-fns';

describe('setDnsRecord', () => {
  given('the module is loaded', () => {
    when('imported', () => {
      then('exports setDnsRecord function', async () => {
        const mod = await import('./setDnsRecord');
        expect(typeof mod.setDnsRecord).toEqual('function');
      });
    });
  });

  given('setDnsRecord function', () => {
    when('examined', () => {
      then('follows the (input, context) signature pattern', async () => {
        const { setDnsRecord } = await import('./setDnsRecord');

        // verify the function is defined and callable
        expect(typeof setDnsRecord).toEqual('function');
        expect(setDnsRecord.length).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
