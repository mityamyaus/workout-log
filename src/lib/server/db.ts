import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __waPrisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __waPool: Pool | undefined;
}

function createClient() {
  const connectionString = process.env.DATABASE_URL!;
  const pool =
    global.__waPool ??
    (() => {
      const p = new Pool({
        connectionString,
        max: 1,
        idleTimeoutMillis: 1_000,
        connectionTimeoutMillis: 15_000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 1_000,
      });
      p.on("error", (err) => {
        console.error("pg pool idle client error", err.message);
      });
      return p;
    })();
  global.__waPool = pool;
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });

  const RETRYABLE = ["Connection terminated unexpectedly", "timeout exceeded when trying to connect", "Connection terminated"];
  client.$use(async (params, next) => {
    let attempt = 0;
    for (;;) {
      try {
        return await next(params);
      } catch (err) {
        attempt++;
        const message = err instanceof Error ? err.message : String(err);
        const retryable = RETRYABLE.some((m) => message.includes(m));
        if (!retryable || attempt >= 3) throw err;
        await new Promise((r) => setTimeout(r, 200 * attempt));
      }
    }
  });

  return client;
}

export const prisma = global.__waPrisma ?? createClient();
if (process.env.NODE_ENV !== "production") global.__waPrisma = prisma;
