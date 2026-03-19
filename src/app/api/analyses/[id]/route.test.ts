import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getAnalysisById: vi.fn(),
  deleteAnalysisById: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  getAnalysisById: dbMocks.getAnalysisById,
  deleteAnalysisById: dbMocks.deleteAnalysisById,
}));

import { DELETE, GET } from "@/app/api/analyses/[id]/route";

describe("api/analyses/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a saved analysis", async () => {
    dbMocks.getAnalysisById.mockReturnValue({
      id: "analysis-1",
      title: "测试记录",
      model: "gpt-4.1-mini",
      questionCount: 40,
      jobText: "job",
      resumeText: "resume",
      warnings: [],
      result: {
        company: "OpenAI",
        role: "前端工程师",
        categories: [],
      },
      createdAt: 1,
      updatedAt: 1,
    });

    const response = await GET(new Request("http://localhost/api/analyses/analysis-1"), {
      params: Promise.resolve({ id: "analysis-1" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      analysis: {
        id: "analysis-1",
      },
    });
  });

  it("returns 404 when analysis does not exist", async () => {
    dbMocks.getAnalysisById.mockReturnValue(null);

    const response = await GET(new Request("http://localhost/api/analyses/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(404);
  });

  it("deletes an existing analysis", async () => {
    dbMocks.deleteAnalysisById.mockReturnValue(true);

    const response = await DELETE(new Request("http://localhost/api/analyses/analysis-1"), {
      params: Promise.resolve({ id: "analysis-1" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ deleted: true });
  });
});
