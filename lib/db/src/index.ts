import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const rawDbUrl = process.env.DATABASE_URL;
const isPgUrl = Boolean(
  rawDbUrl &&
    (rawDbUrl.startsWith("postgres://") || rawDbUrl.startsWith("postgresql://"))
);

export const pool = isPgUrl ? new Pool({ connectionString: rawDbUrl }) : undefined;

let dbInstance: any;

if (pool) {
  try {
    dbInstance = drizzle(pool, { schema });
  } catch (err) {
    console.warn("[Database] Failed to initialize drizzle:", err);
  }
}

if (!dbInstance) {
  console.warn(
    "[Database] DATABASE_URL not set or not a valid PostgreSQL connection string — active mock state enabled"
  );

  const createMockChain = (): any => {
    const chainableProxy: any = new Proxy(
      function () {},
      {
        get: (_, prop) => {
          if (prop === "then") {
            return (resolve: Function) => resolve([]);
          }
          if (prop === "catch") {
            return () => chainableProxy;
          }
          return chainableProxy;
        },
        apply: () => chainableProxy,
      }
    );
    return chainableProxy;
  };

  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };

  dbInstance = new Proxy({}, {
    get: (_, prop) => {
      if (prop === "query") {
        return new Proxy({}, { get: () => noOp });
      }
      return () => createMockChain();
    },
  });
}

export const db = dbInstance;

export * from "./schema";
