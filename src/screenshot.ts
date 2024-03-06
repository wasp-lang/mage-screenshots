import path from "path";
import { chromium } from "playwright";

export async function takeScreenshot(
  htmlFilePath: string,
  screenshotFilePath: string
): Promise<string> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });
  const absoluteFilePath = path.resolve(htmlFilePath);
  await page.goto(`file://${absoluteFilePath}`);
  await page.screenshot({ path: screenshotFilePath });
  await browser.close();
  return screenshotFilePath;
}
