"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui";

export function DetailActions({ analysisId }: { analysisId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleDelete() {
    if (!window.confirm("删除后无法恢复，确认删除这条历史记录？")) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/analyses/${analysisId}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error?.message || "删除失败，请稍后重试。");
      }

      startTransition(() => {
        router.push("/history");
        router.refresh();
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "删除失败，请稍后重试。");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Button asChild intent="subtle">
          <Link href="/history">返回档案列表</Link>
        </Button>
        <Button asChild intent="subtle">
          <Link href={`/input?from=${analysisId}`}>重新使用这些材料</Link>
        </Button>
        <Button intent="danger" disabled={isPending} onClick={handleDelete}>
          删除记录
        </Button>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
