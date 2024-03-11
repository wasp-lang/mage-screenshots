import { Command } from "commander";
import { generateScreenshotsForApp, getProjectInfo } from "./generate.js";

const program = new Command();
program
  .requiredOption("-u, --url <url>", "URL to fetch the result from")
  .parse(process.argv);

const options = program.opts<{ url: string }>();

const projectInfo = await getProjectInfo(options.url);
for await (const _path of generateScreenshotsForApp(projectInfo)) {
 // Do nothing with the path, I'm not sure how else to consume
 // the async generator
}
