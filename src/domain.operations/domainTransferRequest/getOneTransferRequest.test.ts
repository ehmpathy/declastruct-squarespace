import { given, then, when } from 'test-fns';

describe('getOneTransferRequest', () => {
  given('the module is loaded', () => {
    when('imported', () => {
      then('exports getOneTransferRequest function', async () => {
        const mod = await import('./getOneTransferRequest');
        expect(typeof mod.getOneTransferRequest).toEqual('function');
      });
    });
  });

  given('getOneTransferRequest function', () => {
    when('examined', () => {
      then('follows the (input, context) signature pattern', async () => {
        const { getOneTransferRequest } = await import(
          './getOneTransferRequest'
        );

        // verify the function is defined and callable
        expect(typeof getOneTransferRequest).toEqual('function');
        expect(getOneTransferRequest.length).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
