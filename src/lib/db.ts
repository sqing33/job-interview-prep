import "server-only";

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { DATABASE_FILE_NAME } from "@/lib/constants";
import type { AnalysisRecord, AnalysisResult, AnalysisSummary } from "@/lib/types";
import { firstMeaningfulLine, truncate } from "@/lib/utils";

const analyses = sqliteTable("analyses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  model: text("model").notNull(),
  questionCount: integer("question_count").notNull(),
  jobText: text("job_text").notNull(),
  resumeText: text("resume_text").notNull(),
  resultJson: text("result_json").notNull(),
  warningsJson: text("warnings_json").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

function getDatabasePath() {
  return path.join(/* turbopackIgnore: true */ process.cwd(), "data", DATABASE_FILE_NAME);
}

let database: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (database) {
    return database;
  }

  const databasePath = getDatabasePath();
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const sqlite = new Database(databasePath);
  sqlite.pragma("busy_timeout = 5000");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      model TEXT NOT NULL,
      question_count INTEGER NOT NULL,
      job_text TEXT NOT NULL,
      resume_text TEXT NOT NULL,
      result_json TEXT NOT NULL,
      warnings_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS analyses_created_at_idx ON analyses(created_at DESC);
  `);

  database = drizzle(sqlite, { schema: { analyses } });
  return database;
}

function toAnalysisRecord(row: typeof analyses.$inferSelect): AnalysisRecord {
  return {
    id: row.id,
    title: row.title,
    model: row.model,
    questionCount: row.questionCount,
    jobText: row.jobText,
    resumeText: row.resumeText,
    warnings: JSON.parse(row.warningsJson) as string[],
    result: JSON.parse(row.resultJson) as AnalysisResult,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function buildTitle(result: AnalysisResult, questionCount: number, jobText: string) {
  const roleOrFallback = (result.role ?? firstMeaningfulLine(jobText)) || "目标岗位";

  if (result.company) {
    return truncate(`${result.company} · ${roleOrFallback} · ${questionCount} 题`, 72);
  }

  return truncate(`${roleOrFallback} · ${questionCount} 题`, 72);
}

export function listAnalysisSummaries(): AnalysisSummary[] {
  return getDb()
    .select({
      id: analyses.id,
      title: analyses.title,
      model: analyses.model,
      questionCount: analyses.questionCount,
      createdAt: analyses.createdAt,
    })
    .from(analyses)
    .orderBy(desc(analyses.createdAt))
    .all();
}

export function getAnalysisById(id: string) {
  const row = getDb().select().from(analyses).where(eq(analyses.id, id)).get();
  return row ? toAnalysisRecord(row) : null;
}

export function saveAnalysisRecord(input: {
  model: string;
  questionCount: number;
  jobText: string;
  resumeText: string;
  warnings: string[];
  result: AnalysisResult;
}) {
  const now = Date.now();
  const record: AnalysisRecord = {
    id: randomUUID(),
    title: buildTitle(input.result, input.questionCount, input.jobText),
    model: input.model,
    questionCount: input.questionCount,
    jobText: input.jobText,
    resumeText: input.resumeText,
    warnings: input.warnings,
    result: input.result,
    createdAt: now,
    updatedAt: now,
  };

  getDb()
    .insert(analyses)
    .values({
      id: record.id,
      title: record.title,
      model: record.model,
      questionCount: record.questionCount,
      jobText: record.jobText,
      resumeText: record.resumeText,
      resultJson: JSON.stringify(record.result),
      warningsJson: JSON.stringify(record.warnings),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
    .run();

  return record;
}

export function deleteAnalysisById(id: string) {
  const result = getDb().delete(analyses).where(eq(analyses.id, id)).run();
  return result.changes > 0;
}
