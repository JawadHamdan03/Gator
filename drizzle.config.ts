import { defineConfig } from "drizzle-kit";
import fs from "fs";
import os from "os";
import path from "path";

function getDbUrl(): string {
  const cfgPath = path.join(os.homedir(), ".gatorconfig.json");
  const raw = JSON.parse(fs.readFileSync(cfgPath, "utf-8")) as { db_url?: string };
  if (!raw.db_url || typeof raw.db_url !== "string") {
    throw new Error("Missing db_url in ~/.gatorconfig.json");
  }
  return raw.db_url;
}

export default defineConfig({
  schema: "src/lib/db/schema.ts",
  out: "src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: getDbUrl(),
  },
});
