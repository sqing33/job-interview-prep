import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/db.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.APP_DATABASE_PATH || "./data/interview-prep.sqlite",
  },
});
