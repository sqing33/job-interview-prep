import { z } from "zod";

import { saveAnalysisRecord } from "@/lib/db";
import { toPublicError } from "@/lib/errors";
import { researchCompanyBackground } from "@/lib/company-research";
import {
  analysisRequestSchema,
  generateInterviewAnalysisStream,
} from "@/lib/interview-analysis";
import { getAppSettings, normalizeApiBaseUrl } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const persistedSettings = getAppSettings();
    const headerApiKey = request.headers.get("x-openai-api-key")?.trim();
    const requestedBaseUrl = request.headers.get("x-openai-base-url")?.trim();
    const apiKey = headerApiKey || persistedSettings.apiKey.trim();

    if (!apiKey) {
      return new Response(
        `event: error\ndata: ${JSON.stringify({ message: "请先在设置弹窗中保存 OpenAI API Key。" })}\n\n`,
        { status: 400, headers: { "Content-Type": "text/event-stream" } },
      );
    }

    const baseUrl = normalizeApiBaseUrl(requestedBaseUrl || persistedSettings.apiBaseUrl || "");

    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return new Response(
        `event: error\ndata: ${JSON.stringify({ message: "请求体必须是合法 JSON。" })}\n\n`,
        { status: 400, headers: { "Content-Type": "text/event-stream" } },
      );
    }

    let input;

    try {
      input = analysisRequestSchema.parse(payload);
    } catch (error) {
      const message =
        error instanceof z.ZodError ? error.issues[0]?.message || "输入不合法。" : "输入不合法。";
      return new Response(
        `event: error\ndata: ${JSON.stringify({ message })}\n\n`,
        { status: 400, headers: { "Content-Type": "text/event-stream" } },
      );
    }

    const encoder = new TextEncoder();
    let companyResearch = "";

    try {
      companyResearch = await researchCompanyBackground({
        tavilyApiKey: persistedSettings.tavilyApiKey,
        companyText: input.companyText,
        jobText: input.jobText,
      });
    } catch (error) {
      console.warn("Company research lookup failed", error);
    }

    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(event: string, data: unknown) {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        }

        try {
          if (companyResearch) {
            sendEvent("research", { content: companyResearch });
          }

          for await (const event of generateInterviewAnalysisStream({
            apiKey,
            ...(baseUrl ? { baseUrl } : {}),
            ...(companyResearch ? { companyResearch } : {}),
            ...input,
          })) {
            switch (event.type) {
              case "status":
                sendEvent("status", { message: event.message });
                break;
              case "text":
                sendEvent("text", { delta: event.delta, phase: event.phase });
                break;
              case "done": {
                const analysis = saveAnalysisRecord({
                  model: input.model,
                  questionCount: input.questionCount,
                  companyText: input.companyText,
                  jobText: input.jobText,
                  resumeText: input.resumeText,
                  warnings: event.warnings!,
                  result: event.result!,
                });
                sendEvent("done", {
                  analysisId: analysis.id,
                  title: analysis.title,
                  warnings: analysis.warnings,
                });
                break;
              }
            }
          }
        } catch (error) {
          const publicError = toPublicError(error);
          sendEvent("error", { message: publicError.message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Failed to create streaming analysis", error);
    const publicError = toPublicError(error);
    return new Response(
      `event: error\ndata: ${JSON.stringify({ message: publicError.message })}\n\n`,
      { status: 500, headers: { "Content-Type": "text/event-stream" } },
    );
  }
}
