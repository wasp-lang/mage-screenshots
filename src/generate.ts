import { URL } from "url";
import * as fs from "fs";
import dedent from "dedent";
import { execSync } from "child_process";
import { getHtmlForFile } from "./openai.js";
import { takeScreenshot } from "./screenshot.js";
import { inputCssFile, outputCssFile, resultsDir } from "./constants.js";

export type File = {
  name: string;
  content: string;
};

type Result = {
  json: {
    project: {
      primaryColor: string;
      files: File[];
    };
  };
};

export async function generateScreenshotsForApp(
  rawUrl: string
): Promise<string[]> {
  const url = new URL(rawUrl);
  const appId = url.pathname.split("/").pop();
  if (!appId) {
    console.error("Invalid URL");
    process.exit(1);
  }

  const body = JSON.stringify({ json: { appId } });

  const result = await fetch(
    "https://wasp-ai-server.fly.dev/operations/get-app-generation-result",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    }
  ).then((res) => res.json() as Promise<Result>);

  const project = result.json.project;
  const files = project.files;

  const jsxFilesWithContent = files.filter((file) =>
    file.name.endsWith(".jsx")
  );

  const userFiles = jsxFilesWithContent.filter(
    (file) =>
      !file.name.endsWith("Login.jsx") &&
      !file.name.endsWith("Signup.jsx") &&
      !file.name.endsWith("Layout.jsx")
  );

  const layoutFile = jsxFilesWithContent.find((file) =>
    file.name.endsWith("Layout.jsx")
  );

  if (!layoutFile) {
    console.error("No layout file found");
    process.exit(1);
  }

  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }

  const appDir = `${resultsDir}/${appId}`;
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir);
  }

  const tailwindConfig = dedent`
  const colors = require('tailwindcss/colors')

  /** @type {import('tailwindcss').Config} */
  module.exports = {
    content: ["./**/*.{html,js}"],
    theme: {
      extend: {
        colors: {
          primary: {
            50:  colors.${project.primaryColor}[50],
            100: colors.${project.primaryColor}[100],
            200: colors.${project.primaryColor}[200],
            300: colors.${project.primaryColor}[300],
            400: colors.${project.primaryColor}[400],
            500: colors.${project.primaryColor}[500],
            600: colors.${project.primaryColor}[600],
            700: colors.${project.primaryColor}[700],
            800: colors.${project.primaryColor}[800],
            900: colors.${project.primaryColor}[900],
          }
        }
      },
    },
  }
`;
  fs.writeFileSync(`${appDir}/tailwind.config.js`, tailwindConfig);

  const mainCss = dedent`
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
`;
  fs.writeFileSync(`${appDir}/${inputCssFile}`, mainCss);

  for (let file of userFiles) {
    console.log(`Generating HTML for ${file.name}...`);
    const html = await getHtmlForFile(layoutFile, file);

    if (!html) {
      console.error(`No HTML generated for ${file.name}`);
      continue;
    }

    const baseFileName = file.name.split("/").pop()?.split(".").shift();
    if (!baseFileName) {
      console.error("Invalid file name");
      process.exit(1);
    }
    fs.writeFileSync(`${appDir}/${baseFileName}.html`, html);
  }

  console.log("Running npx tailwindcss...");
  execSync(`npx tailwindcss -i ${inputCssFile} -o ${outputCssFile}`, {
    cwd: appDir,
  });

  const screenshotPaths: string[] = [];
  for (let file of userFiles) {
    const baseFileName = file.name.split("/").pop()?.split(".").shift();
    if (!baseFileName) {
      console.error("Invalid file name");
      process.exit(1);
    }
    console.log(`Taking screenshot for ${baseFileName}.html...`);
    const screenshotPath = await takeScreenshot(
      `${appDir}/${baseFileName}.html`,
      `${appDir}/${baseFileName}.png`
    );
    screenshotPaths.push(screenshotPath);
  }

  return screenshotPaths;
}
