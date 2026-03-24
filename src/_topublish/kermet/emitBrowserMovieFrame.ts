import * as fs from 'fs';
import * as path from 'path';
import type { Page } from 'playwright';
import { withTimeout } from 'wrapper-fns';

/**
 * .what = captures debug screenshot + html as a frame in a browser movie
 * .why = enables step-by-step visual + DOM debug of playwright automation
 * .note = always enabled by default for diagnosis; comment out calls if not needed
 * .note = frames use isotime for natural chronological order
 * .note = screenshot and html share same isotime for correlation
 * .note = screenshot has 5s timeout to prevent blocking main automation
 */

const DEBUG_DIR = '.cache/debug-screenshots';

/**
 * .what = wrap async operation with soft timeout (returns null instead of throwing)
 * .why = screenshot can hang on pages with iframes; must not block automation
 */
const withSoftTimeout = async <T>(
  fn: () => Promise<T>,
  label: string,
): Promise<T | null> => {
  try {
    return await withTimeout(fn, { threshold: { seconds: 5 } })();
  } catch {
    console.warn(`[debug] ${label} timed out`);
    return null;
  }
};

export const emitBrowserMovieFrame = async (input: {
  page: Page;
  frame: { name: string };
}): Promise<void> => {
  const { page, frame } = input;

  // ensure directory exists
  if (!fs.existsSync(DEBUG_DIR)) fs.mkdirSync(DEBUG_DIR, { recursive: true });

  // use isotime for natural chronological order (shared between screenshot + html)
  const isotime = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotFilename = `${isotime}.${frame.name}.png`;
  const htmlFilename = `${isotime}.${frame.name}.html`;
  const screenshotPath = path.join(DEBUG_DIR, screenshotFilename);
  const htmlPath = path.join(DEBUG_DIR, htmlFilename);

  // capture screenshot and html in parallel (same isotime)
  // .note = screenshot has 5s timeout because it can hang on pages with iframes
  // .note = html capture rarely hangs but also gets timeout for safety
  try {
    await Promise.all([
      withSoftTimeout(
        () => page.screenshot({ path: screenshotPath }),
        `screenshot:${frame.name}`,
      ),
      withSoftTimeout(
        () =>
          page.content().then((html) => fs.promises.writeFile(htmlPath, html)),
        `html:${frame.name}`,
      ),
    ]);
    console.log(`[debug] frame: ${frame.name} (screenshot + html)`);
  } catch (error) {
    // debug capture should never block main automation
    console.warn(
      `[debug] frame: ${frame.name} capture failed:`,
      error instanceof Error ? error.message : error,
    );
  }
};
