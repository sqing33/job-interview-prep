"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Paperclip, Sparkles } from "lucide-react";

import { Button, Input } from "@/components/ui";
import { MODEL_PRESETS, QUESTION_COUNT_OPTIONS } from "@/lib/constants";

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
  questionCount,
  onQuestionCountChange,
  resumeText,
  isGenerating,
  onGenerate,
  uploadedFileName,
}: {
  jobText: string;
  model: string;
  onModelChange: (value: string) => void;
  questionCount: 30 | 40 | 50;
  onQuestionCountChange: (value: 30 | 40 | 50) => void;
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
        body: JSON.stringify({ model, questionCount, jobText, resumeText }),
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
    <div className="flex min-h-0 flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
        {!messages.length ? (
          <div className="flex h-full items-center justify-center text-sm text-foreground-soft">
            在右侧粘贴简历，然后点击下方按钮生成。
          </div>
        ) : null}

        {messages.map((msg) => {
          if (msg.type === "job_sent") {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-md bg-foreground px-4 py-3 text-sm text-white">
                  <p className="text-xs font-medium text-white/60 mb-1">已发送招聘信息</p>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          }

          if (msg.type === "file_sent") {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-md bg-foreground/10 px-4 py-2.5 text-sm text-foreground">
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
                <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-white/80 border border-border px-4 py-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
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

      {/* Bottom controls */}
      <div className="shrink-0 border-t border-border bg-surface-strong/80 backdrop-blur-xl px-5 py-3">
        <div className="flex items-center gap-3">
          <Input
            list="chat-model-presets"
            placeholder="模型"
            value={model}
            onChange={(event) => onModelChange(event.target.value)}
            className="w-40 h-9 rounded-xl text-xs"
          />
          <datalist id="chat-model-presets">
            {MODEL_PRESETS.map((preset) => (
              <option key={preset} value={preset} />
            ))}
          </datalist>

          <div className="flex items-center gap-1.5">
            {QUESTION_COUNT_OPTIONS.map((option) => (
              <button
                key={option}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  questionCount === option
                    ? "border-transparent bg-foreground text-white"
                    : "border-border bg-white/68 text-foreground-soft hover:bg-white"
                }`}
                onClick={() => onQuestionCountChange(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>

          <Button
            className="ml-auto h-9 rounded-xl"
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
