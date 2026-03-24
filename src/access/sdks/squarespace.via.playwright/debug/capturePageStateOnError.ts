import * as fs from 'fs';
import * as path from 'path';
import type { Page } from 'playwright';

/**
 * .what = captures page screenshot and HTML on error for debug
 * .why = automatic error diagnostics without manual snapshot calls
 * .note = saved to .cache/debug/{timestamp}/ for easy inspection
 */
export const capturePageStateOnError = async (input: {
  page: Page;
  error: Error;
  operationName?: string;
}): Promise<{ screenshotPath: string; htmlPath: string; metaPath: string }> => {
  const { page, error, operationName } = input;

  // generate timestamp-based directory
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const debugDir = path.join(
    process.cwd(),
    '.cache',
    'debug',
    `${timestamp}${operationName ? `.${operationName}` : ''}`,
  );

  // ensure directory exists
  fs.mkdirSync(debugDir, { recursive: true });

  const screenshotPath = path.join(debugDir, 'screenshot.png');
  const htmlPath = path.join(debugDir, 'page.html');
  const metaPath = path.join(debugDir, 'meta.json');

  try {
    // capture screenshot
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch {
    // best effort - page may be in bad state
    fs.writeFileSync(screenshotPath, 'failed to capture screenshot');
  }

  try {
    // capture HTML
    const html = await page.content();
    fs.writeFileSync(htmlPath, html);
  } catch {
    // best effort - page may be in bad state
    fs.writeFileSync(htmlPath, 'failed to capture html');
  }

  try {
    // capture metadata
    const meta = {
      url: page.url(),
      title: await page.title().catch(() => 'unknown'),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      timestamp: new Date().toISOString(),
      operationName: operationName ?? null,
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  } catch {
    // best effort
    fs.writeFileSync(
      metaPath,
      JSON.stringify({ error: 'failed to capture meta' }),
    );
  }

  // log debug location to console for visibility
  console.error(`\n🐢 error captured → ${debugDir}\n`);

  return { screenshotPath, htmlPath, metaPath };
};
