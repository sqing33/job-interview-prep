"use client";

import { LoaderCircle, Upload } from "lucide-react";

import { Label } from "@/components/ui";

export function DocumentPane({
  inputId,
  isParsing,
  label,
  onFileChange,
  onValueChange,
  value,
  warnings,
}: {
  inputId: string;
  isParsing: boolean;
  label: string;
  onFileChange: (file: File | null) => void;
  onValueChange: (value: string) => void;
  value: string;
  warnings: string[];
}) {
  return (
    <section className="flex min-h-0 flex-col p-5">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-foreground">{label}</h3>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-white/72 px-3.5 py-1.5 text-sm font-medium text-foreground transition hover:bg-white">
          {isParsing ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
          上传文件
          <input
            accept=".pdf,.docx,.txt,.md,.markdown"
            className="hidden"
            id={inputId}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              onFileChange(file);
              event.currentTarget.value = "";
            }}
            type="file"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <Label className="sr-only" htmlFor={`${inputId}-textarea`}>
          {label} 文本
        </Label>
        <textarea
          id={`${inputId}-textarea`}
          className="h-full w-full min-h-0 resize-none border border-border bg-white/72 px-4 py-4 text-sm leading-7 text-foreground outline-none transition placeholder:text-foreground-soft/70 focus:border-border-strong focus:ring-4 focus:ring-[var(--ring)]"
          placeholder={`粘贴${label}内容，或上传文件。`}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
        />
      </div>

      <div className="mt-3 shrink-0 text-xs text-foreground-soft">
        {value.length} 字符
      </div>

      {warnings.length ? (
        <div className="mt-4 shrink-0 rounded-[1rem] border border-border bg-white/62 p-4">
          <p className="text-sm font-semibold text-foreground">解析提示</p>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-foreground-soft">
            {warnings.map((warning) => (
              <li key={warning}>- {warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
