"use client";

import { LoaderCircle, Upload } from "lucide-react";

import { Label } from "@/components/ui";

export function DocumentPane({
  inputId,
  label,
  onFileChange,
  onValueChange,
  value,
  warnings,
  isParsing = false,
}: {
  inputId: string;
  label: string;
  onFileChange?: (file: File | null) => void;
  onValueChange: (value: string) => void;
  value: string;
  warnings: string[];
  isParsing?: boolean;
}) {
  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/50 px-4 py-3 sm:py-2.5">
        <h3 className="text-[15px] font-semibold text-foreground sm:text-sm">{label}</h3>

        {onFileChange ? (
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-white/72 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-white sm:py-1">
            {isParsing ? <LoaderCircle className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            上传
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
        ) : null}
      </div>

      <div className="flex-1 min-h-0">
        <Label className="sr-only" htmlFor={`${inputId}-textarea`}>
          {label} 文本
        </Label>
        <textarea
          id={`${inputId}-textarea`}
          className="h-full w-full resize-none bg-transparent px-4 py-3 text-[15px] leading-7 text-foreground outline-none placeholder:text-foreground-soft/70 sm:text-sm sm:leading-6"
          placeholder={onFileChange ? `粘贴${label}内容，或上传文件。` : `补充${label}，例如企业名称、地址、业务方向、团队背景或产品信息。`}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
        />
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-border/50 px-4 py-2 text-xs text-foreground-soft sm:py-1.5">
        <span>{value.length} 字符</span>
        {warnings.length ? <span className="text-accent-strong">有解析提示</span> : null}
      </div>
    </section>
  );
}
