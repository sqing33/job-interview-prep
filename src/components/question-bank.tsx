"use client";

import * as Tabs from "@radix-ui/react-tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { AnalysisRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

export function QuestionBank({ analysis, className }: { analysis: AnalysisRecord; className?: string }) {
  const firstTab = analysis.result.categories[0]?.key;

  if (!firstTab) {
    return null;
  }

  return (
    <Tabs.Root key={analysis.id} className={cn("space-y-4 sm:space-y-5 lg:space-y-6", className)} defaultValue={firstTab}>
      <Tabs.List className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
        {analysis.result.categories.map((category) => (
          <Tabs.Trigger
            key={category.key}
            value={category.key}
            className="min-w-0 rounded-2xl border border-border bg-white/70 px-3 py-2 text-[15px] font-medium text-foreground-soft outline-none transition sm:rounded-full sm:px-4 sm:text-base data-[state=active]:border-transparent data-[state=active]:bg-foreground data-[state=active]:text-white"
          >
            <span className="truncate">{category.label}</span>
            <span className="ml-1.5 font-mono text-xs opacity-75 sm:ml-2 sm:text-sm">{category.items.length}</span>
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {analysis.result.categories.map((category) => (
        <Tabs.Content key={category.key} value={category.key} className="space-y-4 outline-none">
          {category.items.map((item, index) => (
            <article key={item.id} className="paper-panel rounded-[1.4rem] p-4 sm:rounded-[1.6rem] sm:p-5 lg:rounded-[1.8rem] lg:p-6">
              <div className="mb-3 flex items-start justify-between gap-4 sm:mb-4">
                <div>
                  <p className="eyebrow text-[11px] sm:text-sm">Question {index + 1}</p>
                  <h3 className="mt-2 text-lg font-semibold leading-7 text-foreground sm:text-xl sm:leading-8">
                    {item.question}
                  </h3>
                </div>
              </div>

              <div className="answer-markdown text-[15px] leading-7 text-foreground-soft sm:text-base sm:leading-8">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.answerMarkdown}</ReactMarkdown>
              </div>

              {item.exampleAnswer ? (
                <div className="mt-4 rounded-[1rem] border border-accent/10 bg-accent/6 px-3 py-3 sm:px-4">
                  <p className="mb-2 text-[13px] font-semibold text-accent-strong sm:text-sm">回答示例</p>
                  <p className="whitespace-pre-wrap text-[15px] leading-7 text-foreground-soft sm:text-base sm:leading-8">
                    {item.exampleAnswer}
                  </p>
                </div>
              ) : null}
            </article>
          ))}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
