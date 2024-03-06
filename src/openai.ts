import OpenAI from "openai";
import { type File } from "./generate.js";
import { outputCssFile } from "./constants.js";

export const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

export async function getHtmlForFile(layoutFile: File, file: File) {
  const prompt = `
  - You are developer converting a few React components (${layoutFile.name} with another component inside) to pure HTML and mocking the HTML to look like the React component rendered with sensible mock data.
  - Your output should be a single HTML file that does the following: include ${file.name} as a child in ${layoutFile.name} and render them together.
  - Include a ./${outputCssFile} import at the top of the file.
  - Use a placeholder like https://picsum.photos/300/200 if you need to include an image. Change 200 and 300 to the width and height you need.

  ${layoutFile.name}:
  \`\`\`
  ${layoutFile.content}
  \`\`\`
  ${file.name}:
  \`\`\`
  ${file.content}
  \`\`\`
`;
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are a developer working on a project to convert a few React components to pure HTML. You respond with only HTML and no backticks around it.",
      },
      { role: "user", content: prompt },
    ],
    model: "gpt-4-1106-preview",
  });
  return chatCompletion.choices[0].message.content;
}
