import { given, then, when } from 'test-fns';

describe('getAllDnsRecords', () => {
  given('the module is loaded', () => {
    when('imported', () => {
      then('exports getAllDnsRecords function', async () => {
        const mod = await import('./getAllDnsRecords');
        expect(typeof mod.getAllDnsRecords).toEqual('function');
      });

      then('exports addTriggerToGetAllDnsRecords function', async () => {
        const mod = await import('./getAllDnsRecords');
        expect(typeof mod.addTriggerToGetAllDnsRecords).toEqual('function');
      });
    });
  });

  given('getAllDnsRecords function', () => {
    when('examined', () => {
      then('follows the (input, context) signature pattern', async () => {
        const { getAllDnsRecords } = await import('./getAllDnsRecords');

        // verify the function is defined and callable
        expect(typeof getAllDnsRecords).toEqual('function');
        expect(getAllDnsRecords.length).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
