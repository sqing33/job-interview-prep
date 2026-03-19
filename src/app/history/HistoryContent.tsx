"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { LoaderCircle, Sparkles, SquarePen, Trash2 } from "lucide-react";

import { Button, Badge } from "@/components/ui";
import type { AnalysisSummary } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function HistoryContent({ initialHistory }: { initialHistory: AnalysisSummary[] }) {
  const [history, setHistory] = useState(initialHistory);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);

    try {
      const response = await fetch(`/api/analyses/${id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload) {
        throw new Error(payload?.error?.message || "删除失败。");
      }

      startTransition(() => {
        setHistory((prev) => prev.filter((item) => item.id !== id));
      });
    } catch {
      // ignore — user can retry
    } finally {
      setDeletingId(null);
    }
  }

  if (!history.length) {
    return (
      <div className="paper-panel flex min-h-[400px] items-center justify-center rounded-[1.8rem] border-dashed px-8 text-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">暂无分析记录</h2>
          <p className="mt-3 text-sm leading-7 text-foreground-soft">
            去&quot;材料输入&quot;页开始生成。
          </p>
          <Button asChild className="mt-5">
            <Link href="/input">开始输入</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {history.map((item) => {
        const isDeleting = deletingId === item.id;

        return (
          <article key={item.id} className="paper-panel rounded-[1.8rem] p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="line-clamp-2 text-xl font-semibold text-foreground">{item.title}</h3>
              </div>
              <button
                aria-label="删除记录"
                className="rounded-full p-2 text-foreground-soft transition hover:bg-foreground/6 hover:text-foreground"
                disabled={isDeleting}
                onClick={() => handleDelete(item.id)}
                type="button"
              >
                {isDeleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{item.model}</Badge>
              <Badge>{item.questionCount} 题</Badge>
              <Badge>{formatDateTime(item.createdAt)}</Badge>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild size="sm">
                <Link href={`/analyses/${item.id}`}>
                  <Sparkles className="size-4" />
                  查看结果
                </Link>
              </Button>
              <Button asChild intent="subtle" size="sm">
                <Link href={`/input?from=${item.id}`}>
                  <SquarePen className="size-4" />
                  带入输入
                </Link>
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
