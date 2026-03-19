"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LoaderCircle, Settings2 } from "lucide-react";

import { Button, Input, Label } from "@/components/ui";
import { APP_NAME } from "@/lib/constants";
import type { AppSettings } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/history", label: "分析档案" },
  { href: "/input", label: "材料输入" },
];

export function Navbar({ initialSettings }: { initialSettings: AppSettings }) {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [settingsDraft, setSettingsDraft] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  function openSettings() {
    setSettingsDraft(settings);
    setSettingsMessage(null);
    setIsSettingsOpen(true);
  }

  async function handleSave() {
    setSettingsMessage(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsDraft),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.settings) {
        throw new Error(payload?.error?.message || "保存设置失败。");
      }

      startTransition(() => {
        setSettings(payload.settings);
        setSettingsDraft(payload.settings);
      });

      setSettingsMessage("设置已保存。");
      window.setTimeout(() => setIsSettingsOpen(false), 320);
    } catch (error) {
      setSettingsMessage(error instanceof Error ? error.message : "保存设置失败。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <nav className="shrink-0 border-b border-border bg-surface-strong/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1700px] items-center gap-6 px-5 lg:px-7">
          <Link className="text-sm font-semibold tracking-tight text-foreground" href="/history">
            {APP_NAME}
          </Link>

          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-foreground !text-white"
                      : "text-foreground-soft hover:bg-white/60 hover:text-foreground"
                  }`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              aria-label="API 设置"
              className="rounded-full p-2 text-foreground-soft transition hover:bg-white/60 hover:text-foreground"
              onClick={openSettings}
              type="button"
            >
              <Settings2 className="size-4" />
            </button>
          </div>
        </div>
      </nav>

      {isSettingsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(13,18,27,0.42)] px-4 py-8 backdrop-blur-sm">
          <div className="paper-panel w-full max-w-xl rounded-[2rem] p-6 lg:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">API Settings</p>
                <h2 className="mt-3 text-2xl font-semibold text-foreground">设置 OpenAI 连接信息</h2>
              </div>

              <button
                aria-label="关闭设置弹窗"
                className="rounded-full border border-border bg-white/72 px-3 py-1.5 text-sm text-foreground-soft transition hover:text-foreground"
                onClick={() => setIsSettingsOpen(false)}
                type="button"
              >
                关闭
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div className="space-y-3">
                <Label htmlFor="navbar-api-key">OpenAI API Key</Label>
                <Input
                  id="navbar-api-key"
                  autoComplete="off"
                  placeholder="sk-..."
                  type="password"
                  value={settingsDraft.apiKey}
                  onChange={(event) =>
                    setSettingsDraft((prev) => ({ ...prev, apiKey: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="navbar-default-model">默认模型</Label>
                <Input
                  id="navbar-default-model"
                  autoComplete="off"
                  placeholder="gpt-5.4"
                  value={settingsDraft.defaultModel}
                  onChange={(event) =>
                    setSettingsDraft((prev) => ({ ...prev, defaultModel: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="navbar-api-url">API URL</Label>
                <Input
                  id="navbar-api-url"
                  autoComplete="off"
                  placeholder="https://your-gateway.example/v1"
                  value={settingsDraft.apiBaseUrl}
                  onChange={(event) =>
                    setSettingsDraft((prev) => ({ ...prev, apiBaseUrl: event.target.value }))
                  }
                />
                <p className="text-xs leading-6 text-foreground-soft">
                  可留空。填写时建议直接写到 /v1 层级。
                </p>
              </div>
            </div>

            {settingsMessage ? (
              <div className="mt-5 rounded-[1.3rem] border border-border bg-white/65 px-4 py-3 text-sm text-foreground-soft">
                {settingsMessage}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button intent="ghost" onClick={() => setIsSettingsOpen(false)} type="button">
                取消
              </Button>
              <Button disabled={isSaving} onClick={handleSave} type="button">
                {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : <Settings2 className="size-4" />}
                保存设置
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
