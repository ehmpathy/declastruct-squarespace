import * as fs from 'fs';
import * as readline from 'readline';

/**
 * .what - wait for human to signal captcha solved
 * .why - tier 3 fallback when checkbox click fails (puzzle challenge)
 */
export const waitForHumanSignal = async (input: {
  signalMode: 'stdin' | 'file';
  signalFilePath?: string;
}): Promise<void> => {
  const { signalMode, signalFilePath } = input;

  console.log('\ncaptcha detected — solve in browser window');

  if (signalMode === 'stdin') {
    console.log('press ENTER after solve...\n');
    await waitForEnter();
  } else if (signalMode === 'file' && signalFilePath) {
    console.log(`create file at ${signalFilePath} when done...\n`);
    await waitForFile(signalFilePath);
  }
};

/**
 * .what - wait for ENTER keypress on stdin
 * .why - simple human signal for interactive terminals
 */
const waitForEnter = (): Promise<void> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((fulfill) => {
    rl.question('', () => {
      rl.close();
      fulfill();
    });
  });
};

/**
 * .what - wait for file creation at path
 * .why - non-interactive human signal for CI environments
 */
const waitForFile = (filePath: string): Promise<void> => {
  return new Promise((fulfill) => {
    const check = () => {
      // check if file exists
      const fileExists = fs.existsSync(filePath);
      if (fileExists) {
        fs.unlinkSync(filePath); // clean up signal file
        fulfill();
        return;
      }

      // file not found, poll again
      setTimeout(check, 500);
    };
    check();
  });
};
