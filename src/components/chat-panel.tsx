"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Paperclip, Sparkles } from "lucide-react";

import { Button, Input } from "@/components/ui";

interface ChatMessage {
  id: string;
  type: "job_sent" | "file_sent" | "thinking" | "status" | "done" | "error";
  content: string;
  fileName?: string;
  analysisId?: string;
}

let messageId = 0;
function nextId() {
  return `msg-${++messageId}`;
}

export function ChatPanel({
  jobText,
  model,
  onModelChange,
  resumeText,
  isGenerating,
  onGenerate,
  uploadedFileName,
}: {
  jobText: string;
  model: string;
  onModelChange: (value: string) => void;
  resumeText: string;
  isGenerating: boolean;
  onGenerate: () => void;
  uploadedFileName: string | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [localGenerating, setLocalGenerating] = useState(false);

  const generating = isGenerating || localGenerating;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleGenerate() {
    if (!jobText.trim() || !resumeText.trim() || generating) return;

    setLocalGenerating(true);

    const sentMessages: ChatMessage[] = [
      { id: nextId(), type: "job_sent", content: jobText.slice(0, 200) + (jobText.length > 200 ? "..." : "") },
    ];

    if (uploadedFileName) {
      sentMessages.push({ id: nextId(), type: "file_sent", content: "", fileName: uploadedFileName });
    }

    setMessages(sentMessages);

    try {
      const response = await fetch("/api/analyses/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, questionCount: 50, jobText, resumeText }),
      });

      if (!response.ok || !response.body) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error?.message || "请求失败");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let currentEvent = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            if (currentEvent === "status") {
              setMessages((prev) => [...prev, { id: nextId(), type: "status", content: data.message }]);
            } else if (currentEvent === "text") {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.type === "thinking") {
                  return [...prev.slice(0, -1), { ...last, content: last.content + data.delta }];
                }
                return [...prev, { id: nextId(), type: "thinking", content: data.delta }];
              });
            } else if (currentEvent === "done") {
              setMessages((prev) => [
                ...prev,
                {
                  id: nextId(),
                  type: "done",
                  content: data.title,
                  analysisId: data.analysisId,
                },
              ]);
            } else if (currentEvent === "error") {
              setMessages((prev) => [...prev, { id: nextId(), type: "error", content: data.message }]);
            }
          }
        }
      }

      onGenerate();
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          type: "error",
          content: error instanceof Error ? error.message : "生成失败，请稍后重试。",
        },
      ]);
    } finally {
      setLocalGenerating(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-[10rem] flex-1 overflow-y-auto">
        {!messages.length ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm leading-6 text-foreground-soft">
            先输入招聘信息和简历，再开始生成面试分析。
          </div>
        ) : (
          <div className="space-y-4 p-4 sm:p-5">
            {messages.map((msg) => {
              if (msg.type === "job_sent") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[92%] rounded-2xl rounded-br-md bg-foreground px-4 py-3 text-sm text-white sm:max-w-[80%]">
                      <p className="mb-1 text-xs font-medium text-white/60">已发送招聘信息</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                );
              }

              if (msg.type === "file_sent") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[92%] rounded-2xl rounded-br-md bg-foreground/10 px-4 py-2.5 text-sm text-foreground sm:max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <Paperclip className="size-4 text-foreground-soft" />
                        <span>{msg.fileName}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (msg.type === "thinking") {
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="max-w-[96%] rounded-2xl rounded-bl-md border border-border bg-white/80 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground sm:max-w-[90%]">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              if (msg.type === "status") {
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="rounded-full bg-accent/10 px-4 py-2 text-sm text-accent-strong">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              if (msg.type === "done") {
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="rounded-2xl bg-teal/10 border border-teal/20 px-4 py-3 text-sm text-teal">
                      <p className="font-semibold">✅ {msg.content}</p>
                      <a
                        className="mt-2 inline-block text-xs font-medium underline hover:no-underline"
                        href={`/analyses/${msg.analysisId}`}
                      >
                        查看完整结果 →
                      </a>
                    </div>
                  </div>
                );
              }

              if (msg.type === "error") {
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="rounded-2xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              return null;
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border bg-surface-strong/80 px-4 py-3 backdrop-blur-xl sm:px-5">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Input
            placeholder="输入模型，例如 gpt-5.4"
            value={model}
            onChange={(event) => onModelChange(event.target.value)}
            className="h-9 min-w-0 flex-1 rounded-xl text-xs sm:text-sm"
          />

          <Button
            className="h-9 shrink-0 rounded-xl px-4 sm:px-5"
            disabled={generating || !jobText.trim() || !resumeText.trim()}
            onClick={handleGenerate}
            size="sm"
            type="button"
          >
            {generating ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            生成
          </Button>
        </div>
      </div>
    </div>
  );
}
