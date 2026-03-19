import "server-only";

import fs from "node:fs";
import path from "node:path";

import { z } from "zod";

import { SETTINGS_FILE_NAME } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import type { AppSettings } from "@/lib/types";

const settingsSchema = z.object({
  apiKey: z.string().default(""),
  apiBaseUrl: z.string().default(""),
  updatedAt: z.number().nullable().default(null),
});

const saveSettingsSchema = z.object({
  apiKey: z.string().trim().default(""),
  apiBaseUrl: z.string().trim().default(""),
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
  const nextSettings: AppSettings = {
    apiKey: parsed.apiKey,
    apiBaseUrl: normalizeApiBaseUrl(parsed.apiBaseUrl),
    updatedAt: Date.now(),
  };

  ensureSettingsDirectory();
  fs.writeFileSync(getSettingsPath(), JSON.stringify(nextSettings, null, 2), "utf-8");

  return nextSettings;
}
