import type { CategoryKey } from "@/lib/types";

export const APP_NAME = "Job Interview Dossier";
export const DEFAULT_MODEL = "gpt-4.1-mini";
export const MODEL_PRESETS = ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini", "gpt-4o", "o4-mini"];
export const QUESTION_COUNT_OPTIONS = [30, 40, 50] as const;
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_COMBINED_TEXT_LENGTH = 60_000;
export const MAX_SINGLE_TEXT_LENGTH = 40_000;
export const DATABASE_FILE_NAME = "interview-prep.sqlite";
export const SETTINGS_FILE_NAME = "app-settings.json";

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  technical: "技术题",
  project: "项目题",
  behavioral: "行为题",
  fit: "岗位匹配题",
};

export const QUESTION_QUOTAS: Record<number, Record<CategoryKey, number>> = {
  30: {
    technical: 10,
    project: 8,
    behavioral: 6,
    fit: 6,
  },
  40: {
    technical: 14,
    project: 10,
    behavioral: 8,
    fit: 8,
  },
  50: {
    technical: 18,
    project: 12,
    behavioral: 10,
    fit: 10,
  },
};

export const SUPPORTED_UPLOAD_EXTENSIONS = [".pdf", ".docx", ".txt", ".md", ".markdown"];
