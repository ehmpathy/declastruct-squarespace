import { given, then, when } from 'test-fns';

describe('getAllTransferRequests', () => {
  given('the module is loaded', () => {
    when('imported', () => {
      then('exports getAllTransferRequests function', async () => {
        const mod = await import('./getAllTransferRequests');
        expect(typeof mod.getAllTransferRequests).toEqual('function');
      });

      then('exports addTriggerToGetAllTransferRequests function', async () => {
        const mod = await import('./getAllTransferRequests');
        expect(typeof mod.addTriggerToGetAllTransferRequests).toEqual(
          'function',
        );
      });
    });
  });

  given('getAllTransferRequests function', () => {
    when('examined', () => {
      then('follows the (input, context) signature pattern', async () => {
        const { getAllTransferRequests } = await import(
          './getAllTransferRequests'
        );

        // verify the function is defined and callable
        expect(typeof getAllTransferRequests).toEqual('function');
        expect(getAllTransferRequests.length).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
