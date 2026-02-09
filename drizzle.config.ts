import { defineConfig } from "drizzle-kit";
import { readConfig } from "./src/lib/config";

const config = readConfig();

export default defineConfig({
  schema: "src/lib/db/schema.ts",
  out: "src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: config.db.url,
  },
});
