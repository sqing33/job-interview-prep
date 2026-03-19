import "server-only";

import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

import { MAX_UPLOAD_SIZE_BYTES, SUPPORTED_UPLOAD_EXTENSIONS } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import type { ParsedDocumentResponse } from "@/lib/types";
import { getFileExtension, normalizeMultilineText } from "@/lib/utils";

function assertSupportedDocument(filename: string) {
  const extension = getFileExtension(filename);

  if (!SUPPORTED_UPLOAD_EXTENSIONS.includes(extension)) {
    throw new AppError(
      400,
      "UNSUPPORTED_FILE_TYPE",
      `仅支持 ${SUPPORTED_UPLOAD_EXTENSIONS.join(", ")} 文件。`,
    );
  }

  return extension;
}

export async function parseUploadedDocument(file: File): Promise<ParsedDocumentResponse> {
  if (!file.name) {
    throw new AppError(400, "MISSING_FILENAME", "请上传带文件名的文档。");
  }

  if (file.size === 0) {
    throw new AppError(400, "EMPTY_FILE", "上传的文件为空。");
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new AppError(413, "FILE_TOO_LARGE", "文件超过 10MB 限制。");
  }

  const extension = assertSupportedDocument(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (extension === ".pdf") {
    return parsePdfDocument(file.name, buffer);
  }

  if (extension === ".docx") {
    return parseDocxDocument(file.name, buffer);
  }

  return parseTextDocument(file.name, buffer, extension === ".md" || extension === ".markdown");
}

async function parsePdfDocument(filename: string, buffer: Buffer): Promise<ParsedDocumentResponse> {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const text = normalizeMultilineText(result.text ?? "");
    const warnings: string[] = [];

    if (!text) {
      throw new AppError(422, "EMPTY_PDF_TEXT", "PDF 中没有提取到可用文本，请改用文本粘贴或检查是否为扫描件。");
    }

    if (text.length < 120) {
      warnings.push("PDF 提取到的文本较少，若是扫描件或版式复杂，请手动检查并补全文本。");
    }

    return {
      filename,
      sourceType: "pdf",
      text,
      warnings,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(422, "PDF_PARSE_FAILED", "PDF 解析失败，请尝试重新导出后再上传。");
  } finally {
    await parser.destroy();
  }
}

async function parseDocxDocument(filename: string, buffer: Buffer): Promise<ParsedDocumentResponse> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = normalizeMultilineText(result.value ?? "");
    const warnings = result.messages.map((message) => `DOCX 解析提示：${message.message}`);

    if (!text) {
      throw new AppError(422, "EMPTY_DOCX_TEXT", "DOCX 中没有提取到可用文本，请检查文档内容。");
    }

    return {
      filename,
      sourceType: "docx",
      text,
      warnings,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(422, "DOCX_PARSE_FAILED", "DOCX 解析失败，请尝试另存为新版 .docx 后重试。");
  }
}

function parseTextDocument(filename: string, buffer: Buffer, isMarkdown: boolean): ParsedDocumentResponse {
  const decoder = new TextDecoder("utf-8");
  const text = normalizeMultilineText(decoder.decode(buffer));

  if (!text) {
    throw new AppError(422, "EMPTY_TEXT_FILE", "文本文件中没有可用内容。");
  }

  return {
    filename,
    sourceType: isMarkdown ? "markdown" : "text",
    text,
    warnings: [],
  };
}
