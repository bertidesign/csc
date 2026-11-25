import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL non configurata.");

  return drizzle({ client: neon(connectionString), schema });
}

let database: ReturnType<typeof createDb> | undefined;

export function getDb() {
  return (database ??= createDb());
}
