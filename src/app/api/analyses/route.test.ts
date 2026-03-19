import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  listAnalysisSummaries: vi.fn(),
  saveAnalysisRecord: vi.fn(),
}));

const analysisMocks = vi.hoisted(() => ({
  generateInterviewAnalysis: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  listAnalysisSummaries: dbMocks.listAnalysisSummaries,
  saveAnalysisRecord: dbMocks.saveAnalysisRecord,
}));

vi.mock("@/lib/interview-analysis", async () => {
  const actual = await vi.importActual<typeof import("@/lib/interview-analysis")>("@/lib/interview-analysis");

  return {
    ...actual,
    generateInterviewAnalysis: analysisMocks.generateInterviewAnalysis,
  };
});

import { GET, POST } from "@/app/api/analyses/route";

const requestBody = {
  model: "gpt-4.1-mini",
  questionCount: 40,
  jobText:
    "负责前端架构、性能优化和工程平台建设，要求熟悉 React、TypeScript、组件化设计、跨团队协作以及复杂业务交付推进。",
  resumeText:
    "负责过中后台、活动页和组件平台，主导性能优化、规范建设与跨团队联调落地，也承担过技术方案拆解、新人带教和发布流程治理工作。",
};

describe("api/analyses route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists saved analyses", async () => {
    dbMocks.listAnalysisSummaries.mockReturnValue([
      {
        id: "analysis-1",
        title: "某公司 · 前端工程师 · 40 题",
        model: "gpt-4.1-mini",
        questionCount: 40,
        createdAt: 1,
      },
    ]);

    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      analyses: dbMocks.listAnalysisSummaries.mock.results[0]?.value,
    });
  });

  it("rejects missing api key", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "MISSING_API_KEY",
      },
    });
  });

  it("creates an analysis record", async () => {
    analysisMocks.generateInterviewAnalysis.mockResolvedValue({
      warnings: [],
      result: {
        company: "OpenAI",
        role: "前端工程师",
        categories: [],
      },
    });

    dbMocks.saveAnalysisRecord.mockReturnValue({
      id: "analysis-1",
      title: "OpenAI · 前端工程师 · 40 题",
      model: "gpt-4.1-mini",
      questionCount: 40,
      jobText: requestBody.jobText,
      resumeText: requestBody.resumeText,
      warnings: [],
      result: {
        company: "OpenAI",
        role: "前端工程师",
        categories: [],
      },
      createdAt: 123,
      updatedAt: 123,
    });

    const response = await POST(
      new Request("http://localhost/api/analyses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-openai-api-key": "sk-test",
        },
        body: JSON.stringify(requestBody),
      }),
    );

    expect(response.status).toBe(201);
    expect(analysisMocks.generateInterviewAnalysis).toHaveBeenCalledWith({
      apiKey: "sk-test",
      ...requestBody,
    });
    await expect(response.json()).resolves.toMatchObject({
      analysisId: "analysis-1",
      analysis: {
        title: "OpenAI · 前端工程师 · 40 题",
      },
    });
  });

  it("passes a custom api url to the analysis pipeline", async () => {
    analysisMocks.generateInterviewAnalysis.mockResolvedValue({
      warnings: [],
      result: {
        company: "OpenAI",
        role: "前端工程师",
        categories: [],
      },
    });

    dbMocks.saveAnalysisRecord.mockReturnValue({
      id: "analysis-2",
      title: "OpenAI · 前端工程师 · 40 题",
      model: "gpt-4.1-mini",
      questionCount: 40,
      jobText: requestBody.jobText,
      resumeText: requestBody.resumeText,
      warnings: [],
      result: {
        company: "OpenAI",
        role: "前端工程师",
        categories: [],
      },
      createdAt: 456,
      updatedAt: 456,
    });

    const response = await POST(
      new Request("http://localhost/api/analyses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-openai-api-key": "sk-test",
          "x-openai-base-url": "https://gateway.example.com/v1/",
        },
        body: JSON.stringify(requestBody),
      }),
    );

    expect(response.status).toBe(201);
    expect(analysisMocks.generateInterviewAnalysis).toHaveBeenCalledWith({
      apiKey: "sk-test",
      baseUrl: "https://gateway.example.com/v1",
      ...requestBody,
    });
  });

  it("rejects invalid custom api url", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-openai-api-key": "sk-test",
          "x-openai-base-url": "not-a-url",
        },
        body: JSON.stringify(requestBody),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "INVALID_API_BASE_URL",
      },
    });
  });
});
