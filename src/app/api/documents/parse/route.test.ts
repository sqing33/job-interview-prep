import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  parseUploadedDocument: vi.fn(),
}));

vi.mock("@/lib/documents", () => ({
  parseUploadedDocument: mocks.parseUploadedDocument,
}));

import { POST } from "@/app/api/documents/parse/route";

describe("POST /api/documents/parse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed content", async () => {
    mocks.parseUploadedDocument.mockResolvedValue({
      filename: "resume.pdf",
      sourceType: "pdf",
      text: "解析后的文本",
      warnings: [],
    });

    const formData = new FormData();
    formData.append("file", new File(["pdf"], "resume.pdf", { type: "application/pdf" }));

    const response = await POST({
      formData: async () => formData,
    } as Request);

    await expect(response.json()).resolves.toMatchObject({
      text: "解析后的文本",
      sourceType: "pdf",
    });
  });

  it("rejects missing files", async () => {
    const response = await POST({
      formData: async () => new FormData(),
    } as Request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "MISSING_FILE",
      },
    });
  });
});
