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
    <Tabs.Root key={analysis.id} className={cn("space-y-6", className)} defaultValue={firstTab}>
      <Tabs.List className="flex flex-wrap gap-3">
        {analysis.result.categories.map((category) => (
          <Tabs.Trigger
            key={category.key}
            value={category.key}
            className="rounded-full border border-border bg-white/70 px-4 py-2 text-sm font-medium text-foreground-soft outline-none transition data-[state=active]:border-transparent data-[state=active]:bg-foreground data-[state=active]:text-white"
          >
            {category.label}
            <span className="ml-2 font-mono text-xs opacity-75">{category.items.length}</span>
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {analysis.result.categories.map((category) => (
        <Tabs.Content key={category.key} value={category.key} className="space-y-4 outline-none">
          {category.items.map((item, index) => (
            <article
              key={item.id}
              className="paper-panel rounded-[1.8rem] p-6"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Question {index + 1}</p>
                  <h3 className="mt-2 text-lg font-semibold leading-8 text-foreground">{item.question}</h3>
                </div>
              </div>

              <div className="answer-markdown text-sm leading-7 text-foreground-soft">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.answerMarkdown}</ReactMarkdown>
              </div>
            </article>
          ))}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
