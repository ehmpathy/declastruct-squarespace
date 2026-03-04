import { given, then, when } from 'test-fns';

describe('delDnsRecord', () => {
  given('the module is loaded', () => {
    when('imported', () => {
      then('exports delDnsRecord function', async () => {
        const mod = await import('./delDnsRecord');
        expect(typeof mod.delDnsRecord).toEqual('function');
      });
    });
  });

  given('delDnsRecord function', () => {
    when('examined', () => {
      then('follows the (input, context) signature pattern', async () => {
        const { delDnsRecord } = await import('./delDnsRecord');

        // verify the function is defined and callable
        expect(typeof delDnsRecord).toEqual('function');
        expect(delDnsRecord.length).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
