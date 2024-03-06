import Fastify from "fastify";
import FastifyStatic from "@fastify/static";
import cors from "@fastify/cors";

import * as zod from "zod";
import { generateScreenshotsForApp } from "./generate.js";

const fastify = Fastify({
  logger: true,
});

fastify.register(cors);

fastify.register(FastifyStatic, {
  root: new URL("../results", import.meta.url).pathname,
  prefix: "/results/",
});

const querySchema = zod.object({
  url: zod.string().url(),
});

const db = createDatabase();

fastify.get("/generate", async (request, reply) => {
  const { url } = querySchema.parse(request.query);
  const state = db.get(url);

  const stateResponse = {
    statusUrl: `/status?url=${encodeURIComponent(url)}`,
  };

  // If the state is already in the database, return the status URL
  if (state) {
    return stateResponse;
  }

  db.set(url, {
    state: "running",
    startedAt: Date.now(),
    url,
    paths: [],
  });

  async function generate() {
    const localPaths = await generateScreenshotsForApp(url);
    const urls = localPaths.map((path) =>
      path.replace(/^\.\/results/, "/results")
    );
    db.update(url, {
      state: "done",
      paths: urls,
      endedAt: Date.now(),
    });
  }

  generate().catch((error) => {
    db.update(url, { state: "error" });
    fastify.log.error(error);
  });

  return stateResponse;
});

fastify.get("/status", async (request, reply) => {
  const { url } = querySchema.parse(request.query);
  const state = db.get(url);
  if (!state) {
    return reply.code(404).send({ error: "No screenshots for this URL" });
  }
  return state;
});

try {
  await fastify.listen({ port: 3001 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

type State = {
  startedAt: number;
  endedAt?: number;
  state: "running" | "done" | "error";
  url: string;
  paths: string[];
};

function createDatabase() {
  const map = new Map<string, State>();
  return {
    get: (url: string) => map.get(url),
    set: (url: string, state: State) => map.set(url, state),
    update: (url: string, state: Partial<State>) => {
      const existing = map.get(url);
      if (!existing) {
        return;
      }
      map.set(url, { ...existing, ...state });
    },
  };
}
