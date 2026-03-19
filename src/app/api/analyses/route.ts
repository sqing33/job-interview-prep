import { z } from "zod";

import { listAnalysisSummaries, saveAnalysisRecord } from "@/lib/db";
import { AppError, errorToResponse } from "@/lib/errors";
import { analysisRequestSchema, generateInterviewAnalysis } from "@/lib/interview-analysis";
import { getAppSettings, normalizeApiBaseUrl } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ analyses: listAnalysisSummaries() });
  } catch (error) {
    console.error("Failed to list analyses", error);
    return errorToResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const persistedSettings = getAppSettings();
    const headerApiKey = request.headers.get("x-openai-api-key")?.trim();
    const requestedBaseUrl = request.headers.get("x-openai-base-url")?.trim();
    const apiKey = headerApiKey || persistedSettings.apiKey.trim();

    if (!apiKey) {
      throw new AppError(400, "MISSING_API_KEY", "请先在设置弹窗中保存 OpenAI API Key。");
    }

    const baseUrl = normalizeApiBaseUrl(requestedBaseUrl || persistedSettings.apiBaseUrl || "");

    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      throw new AppError(400, "INVALID_JSON", "请求体必须是合法 JSON。");
    }

    const input = analysisRequestSchema.parse(payload);
    const generated = await generateInterviewAnalysis({
      apiKey,
      ...(baseUrl ? { baseUrl } : {}),
      ...input,
    });

    const analysis = saveAnalysisRecord({
      model: input.model,
      questionCount: input.questionCount,
      jobText: input.jobText,
      resumeText: input.resumeText,
      warnings: generated.warnings,
      result: generated.result,
    });

    return Response.json(
      {
        analysisId: analysis.id,
        result: analysis.result,
        analysis,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorToResponse(new AppError(400, "INVALID_ANALYSIS_INPUT", error.issues[0]?.message || "输入不合法。"));
    }

    console.error("Failed to create analysis", error);
    return errorToResponse(error);
  }
}
