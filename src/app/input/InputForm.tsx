"use client";

import { useEffect, useRef, useState } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { DocumentPane } from "@/components/document-pane";
import type { ParsedDocumentResponse } from "@/lib/types";

function hasErrorMessage(payload: unknown): payload is { error?: { message?: string } } {
  return typeof payload === "object" && payload !== null && "error" in payload;
}

export function InputForm({
  initialModel,
  initialCompanyText,
  initialJobText,
  initialResumeText,
}: {
  initialModel: string;
  initialCompanyText: string;
  initialJobText: string;
  initialResumeText: string;
}) {
  const [model, setModel] = useState(initialModel);
  const [companyText, setCompanyText] = useState(initialCompanyText);
  const [jobText, setJobText] = useState(initialJobText);
  const [resumeText, setResumeText] = useState(initialResumeText);
  const [isGenerating, setIsGenerating] = useState(false);
  const [parsingTarget, setParsingTarget] = useState<"job" | "resume" | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [documentWarnings, setDocumentWarnings] = useState<{ job: string[]; resume: string[] }>({
    job: [],
    resume: [],
  });
  const hasHydratedRef = useRef(false);

  async function handleFileParse(kind: "job" | "resume", file: File | null) {
    if (!file) return;

    setParsingTarget(kind);

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
        throw new Error("解析失败");
      }

      if (kind === "job") {
        setJobText(payload.text);
        setUploadedFileName(file.name);
      } else {
        setResumeText(payload.text);
      }

      setDocumentWarnings((prev) => ({
        ...prev,
        [kind]: payload.warnings,
      }));
    } catch {
      // silently
    } finally {
      setParsingTarget(null);
    }
  }

  function handleGenerateDone() {
    setIsGenerating(false);
  }

  useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      return;
    }

    const timer = window.setTimeout(() => {
      void fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultModel: model.trim() || initialModel,
          resumeText,
        }),
      }).catch(() => null);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [initialModel, model, resumeText]);

  return (
    <div className="flex min-h-full flex-col overflow-y-auto pb-4 lg:h-full lg:min-h-0 lg:pb-0 lg:flex-row lg:overflow-hidden">
      <div
        className="order-2 flex min-h-[20rem] min-w-0 flex-col border-t border-border lg:order-1 lg:min-h-0 lg:flex-[0_0_70%] lg:border-t-0 lg:border-r"
      >
        <ChatPanel
          companyText={companyText}
          jobText={jobText}
          model={model}
          onModelChange={setModel}
          resumeText={resumeText}
          isGenerating={isGenerating}
          onGenerate={handleGenerateDone}
          uploadedFileName={uploadedFileName}
        />
      </div>

      <div className="order-1 flex min-w-0 shrink-0 flex-col lg:order-2 lg:flex-[0_0_30%]">
        <div className="min-h-[12rem] border-b border-border lg:min-h-0" style={{ flex: "0.8 1 0" }}>
          <DocumentPane
            inputId="company-text"
            label="企业补充信息"
            value={companyText}
            warnings={[]}
            onValueChange={setCompanyText}
          />
        </div>
        <div className="min-h-[17rem] border-b border-border lg:min-h-0" style={{ flex: "1 1 0" }}>
          <DocumentPane
            inputId="job-upload"
            isParsing={parsingTarget === "job"}
            label="招聘信息"
            onFileChange={(file) => handleFileParse("job", file)}
            value={jobText}
            warnings={documentWarnings.job}
            onValueChange={setJobText}
          />
        </div>
        <div className="min-h-[17rem] lg:min-h-0" style={{ flex: "1 1 0" }}>
          <DocumentPane
            inputId="resume-upload"
            isParsing={parsingTarget === "resume"}
            label="简历信息"
            onFileChange={(file) => handleFileParse("resume", file)}
            value={resumeText}
            warnings={documentWarnings.resume}
            onValueChange={setResumeText}
          />
        </div>
      </div>
    </div>
  );
}
