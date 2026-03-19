import { describe, expect, it } from "vitest";

import { analysisRequestSchema, getQuestionPlan } from "@/lib/interview-analysis";

const jobText =
  "负责 Web 前端架构设计、性能优化与组件库建设，熟悉 React、TypeScript、工程化流程以及跨团队协作，并需要独立推动复杂业务落地。";
const resumeText =
  "5 年前端开发经验，主导过中后台项目和组件平台建设，负责过性能优化、CI/CD 流程、跨端适配与复杂业务交付，也带过新人协作推进上线。";

describe("interview-analysis", () => {
  it("returns the fixed plan for 40 questions", () => {
    expect(getQuestionPlan(40)).toEqual([
      { key: "technical", label: "技术题", count: 14 },
      { key: "project", label: "项目题", count: 10 },
      { key: "behavioral", label: "行为题", count: 8 },
      { key: "fit", label: "岗位匹配题", count: 8 },
    ]);
  });

  it("accepts valid analysis input", () => {
    const parsed = analysisRequestSchema.parse({
      model: "gpt-4.1-mini",
      questionCount: 40,
      jobText,
      resumeText,
    });

    expect(parsed.questionCount).toBe(40);
    expect(parsed.model).toBe("gpt-4.1-mini");
  });

  it("rejects oversized combined text", () => {
    expect(() =>
      analysisRequestSchema.parse({
        model: "gpt-4.1-mini",
        questionCount: 40,
        jobText: "a".repeat(30_100),
        resumeText: "b".repeat(30_100),
      }),
    ).toThrow(/总长度不能超过/);
  });
});
