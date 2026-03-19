"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { DocumentPane } from "@/components/document-pane";
import type { ParsedDocumentResponse } from "@/lib/types";

function hasErrorMessage(payload: unknown): payload is { error?: { message?: string } } {
  return typeof payload === "object" && payload !== null && "error" in payload;
}

export function InputForm({
  initialModel,
  initialQuestionCount,
  initialJobText,
  initialResumeText,
}: {
  initialModel: string;
  initialQuestionCount: 30 | 40 | 50;
  initialJobText: string;
  initialResumeText: string;
}) {
  const [model, setModel] = useState(initialModel);
  const [questionCount, setQuestionCount] = useState<30 | 40 | 50>(initialQuestionCount);
  const [jobText, setJobText] = useState(initialJobText);
  const [resumeText, setResumeText] = useState(initialResumeText);
  const [isGenerating, setIsGenerating] = useState(false);
  const [parsingTarget, setParsingTarget] = useState<"resume" | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [documentWarnings, setDocumentWarnings] = useState<string[]>([]);

  async function handleResumeParse(file: File | null) {
    if (!file) return;

    setParsingTarget("resume");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/documents/parse", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | ParsedDocumentResponse
        | { error?: { message?: string } }
        | null;

      if (!response.ok || !payload || hasErrorMessage(payload)) {
        throw new Error(hasErrorMessage(payload) ? payload.error?.message || "文档解析失败。" : "文档解析失败。");
      }

      setResumeText(payload.text);
      setUploadedFileName(file.name);
      setDocumentWarnings(payload.warnings);
    } catch {
      // error handled silently, user can paste manually
    } finally {
      setParsingTarget(null);
    }
  }

  function handleGenerateDone() {
    setIsGenerating(false);
  }

  return (
    <div className="flex-1 min-h-0 grid grid-cols-[70%_30%]">
      {/* Left: Chat panel */}
      <div className="min-h-0 border-r border-border flex flex-col">
        <div className="shrink-0 border-b border-border px-5 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">招聘信息</h2>
            {uploadedFileName ? (
              <span className="text-xs text-foreground-soft">📎 {uploadedFileName}</span>
            ) : null}
          </div>
          <textarea
            className="mt-3 w-full h-24 resize-none border border-border bg-white/72 rounded-xl px-4 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-foreground-soft/70 focus:border-border-strong focus:ring-4 focus:ring-[var(--ring)]"
            placeholder="粘贴招聘信息，或在下方输入..."
            value={jobText}
            onChange={(event) => setJobText(event.target.value)}
          />
          <div className="mt-1 text-xs text-foreground-soft">{jobText.length} 字符</div>
        </div>

        <div className="flex-1 min-h-0">
          <ChatPanel
            jobText={jobText}
            model={model}
            onModelChange={setModel}
            questionCount={questionCount}
            onQuestionCountChange={setQuestionCount}
            resumeText={resumeText}
            isGenerating={isGenerating}
            onGenerate={handleGenerateDone}
            uploadedFileName={uploadedFileName}
          />
        </div>
      </div>

      {/* Right: Resume panel */}
      <div className="min-h-0 flex flex-col">
        <DocumentPane
          inputId="resume-upload"
          isParsing={parsingTarget === "resume"}
          label="简历信息"
          onFileChange={handleResumeParse}
          value={resumeText}
          warnings={documentWarnings}
          onValueChange={setResumeText}
        />
      </div>
    </div>
  );
}
