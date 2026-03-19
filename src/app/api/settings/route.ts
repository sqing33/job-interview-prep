import { z } from "zod";

import { errorToResponse, AppError } from "@/lib/errors";
import { getAppSettings, saveAppSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ settings: getAppSettings() });
  } catch (error) {
    console.error("Failed to load app settings", error);
    return errorToResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      throw new AppError(400, "INVALID_JSON", "请求体必须是合法 JSON。");
    }

    return Response.json({ settings: saveAppSettings(payload) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorToResponse(new AppError(400, "INVALID_SETTINGS_INPUT", error.issues[0]?.message || "设置不合法。"));
    }

    console.error("Failed to save app settings", error);
    return errorToResponse(error);
  }
}
