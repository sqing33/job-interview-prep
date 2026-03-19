import "server-only";

import fs from "node:fs";
import path from "node:path";

import { z } from "zod";

import { DEFAULT_MODEL, SETTINGS_FILE_NAME } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import type { AppSettings } from "@/lib/types";

const settingsSchema = z.object({
  apiKey: z.string().default(""),
  apiBaseUrl: z.string().default(""),
  tavilyApiKey: z.string().default(""),
  defaultModel: z.string().default(DEFAULT_MODEL),
  resumeText: z.string().default(""),
  updatedAt: z.number().nullable().default(null),
});

const saveSettingsSchema = z.object({
  apiKey: z.string().trim().optional(),
  apiBaseUrl: z.string().trim().optional(),
  tavilyApiKey: z.string().trim().optional(),
  defaultModel: z.string().trim().min(1, "默认模型不能为空。").optional(),
  resumeText: z.string().optional(),
});

function getSettingsPath() {
  return path.join(/* turbopackIgnore: true */ process.cwd(), "data", SETTINGS_FILE_NAME);
}

function ensureSettingsDirectory() {
  fs.mkdirSync(path.dirname(getSettingsPath()), { recursive: true });
}

export function getDefaultAppSettings(): AppSettings {
  return {
    apiKey: "",
    apiBaseUrl: "",
    tavilyApiKey: "",
    defaultModel: DEFAULT_MODEL,
    resumeText: "",
    updatedAt: null,
  };
}

export function normalizeApiBaseUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(trimmed);
  } catch {
    throw new AppError(400, "INVALID_API_BASE_URL", "自定义 API URL 不是合法地址。");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new AppError(400, "INVALID_API_BASE_URL", "自定义 API URL 只支持 http 或 https。");
  }

  return parsedUrl.toString().replace(/\/+$/, "");
}

export function getAppSettings(): AppSettings {
  const settingsPath = getSettingsPath();

  if (!fs.existsSync(settingsPath)) {
    return getDefaultAppSettings();
  }

  try {
    const raw = fs.readFileSync(settingsPath, "utf-8");
    return settingsSchema.parse(JSON.parse(raw));
  } catch (error) {
    console.warn("Failed to read settings file, falling back to defaults", error);
    return getDefaultAppSettings();
  }
}

export function saveAppSettings(input: unknown): AppSettings {
  const parsed = saveSettingsSchema.parse(input);
  const current = getAppSettings();
  const nextSettings: AppSettings = {
    apiKey: parsed.apiKey ?? current.apiKey,
    apiBaseUrl:
      parsed.apiBaseUrl === undefined ? current.apiBaseUrl : normalizeApiBaseUrl(parsed.apiBaseUrl),
    tavilyApiKey: parsed.tavilyApiKey ?? current.tavilyApiKey,
    defaultModel: parsed.defaultModel ?? current.defaultModel,
    resumeText: parsed.resumeText ?? current.resumeText,
    updatedAt: Date.now(),
  };

  ensureSettingsDirectory();
  fs.writeFileSync(getSettingsPath(), JSON.stringify(nextSettings, null, 2), "utf-8");

  return nextSettings;
}
