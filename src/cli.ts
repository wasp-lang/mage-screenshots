import { Command } from "commander";
import { generateScreenshotsForApp } from "./generate.js";

const program = new Command();
program
  .requiredOption("-u, --url <url>", "URL to fetch the result from")
  .parse(process.argv);

const options = program.opts();

await generateScreenshotsForApp(options.url);
