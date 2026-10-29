import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sql: NeonQueryFunction<false, false> | null = null;

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("falta DATABASE_URL (Neon)");
  if (!sql) sql = neon(url);
  return sql;
}

export function dbConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
