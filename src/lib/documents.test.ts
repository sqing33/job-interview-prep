import { beforeEach, describe, expect, it, vi } from "vitest";

const pdfMocks = vi.hoisted(() => {
  const extractRawText = vi.fn();
  const getText = vi.fn();
  const destroy = vi.fn();
  class PDFParse {
    getText(...args: unknown[]) {
      return getText(...args);
    }

    destroy(...args: unknown[]) {
      return destroy(...args);
    }
  }

  return {
    extractRawText,
    getText,
    destroy,
    PDFParse,
  };
});

vi.mock("mammoth", () => ({
  default: {
    extractRawText: pdfMocks.extractRawText,
  },
}));

vi.mock("pdf-parse", () => ({
  PDFParse: pdfMocks.PDFParse,
}));

import { parseUploadedDocument } from "@/lib/documents";

describe("documents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses plain text files", async () => {
    const file = new File(["岗位职责：负责前端工程建设与性能优化"], "jd.txt", {
      type: "text/plain",
    });

    await expect(parseUploadedDocument(file)).resolves.toMatchObject({
      sourceType: "text",
      text: "岗位职责：负责前端工程建设与性能优化",
      warnings: [],
    });
  });

  it("parses docx through mammoth", async () => {
    pdfMocks.extractRawText.mockResolvedValue({
      value: "项目经历\n\n负责 B 端系统改造",
      messages: [{ message: "检测到复杂表格已忽略样式。" }],
    });

    const file = new File(["fake-docx"], "resume.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const parsed = await parseUploadedDocument(file);

    expect(parsed.sourceType).toBe("docx");
    expect(parsed.warnings).toEqual(["DOCX 解析提示：检测到复杂表格已忽略样式。"]);
    expect(pdfMocks.extractRawText).toHaveBeenCalledTimes(1);
  });

  it("parses pdf and returns scan warning when text is sparse", async () => {
    pdfMocks.getText.mockResolvedValue({ text: "过短的 PDF 文本" });

    const file = new File(["fake-pdf"], "resume.pdf", { type: "application/pdf" });
    const parsed = await parseUploadedDocument(file);

    expect(parsed.sourceType).toBe("pdf");
    expect(parsed.warnings[0]).toMatch(/文本较少/);
    expect(pdfMocks.destroy).toHaveBeenCalledTimes(1);
  });

  it("rejects unsupported files", async () => {
    const file = new File(["hello"], "resume.pages", { type: "application/octet-stream" });

    await expect(parseUploadedDocument(file)).rejects.toMatchObject({
      code: "UNSUPPORTED_FILE_TYPE",
    });
  });
});
