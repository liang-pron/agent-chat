"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

interface ImportStatus {
  type: "idle" | "loading" | "success" | "error";
  message?: string;
  agentId?: string;
  agentName?: string;
}

export function ImportForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<ImportStatus>({ type: "idle" });

  const urlError =
    url && !url.match(/^https:\/\/github\.com\/[^/]+\/[^/]+/)
      ? "请输入有效的 GitHub 仓库链接"
      : "";

  const handleImport = async () => {
    if (!url.trim() || urlError) return;

    setStatus({ type: "loading", message: "正在从 GitHub 导入..." });

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: "error", message: data.error || "导入失败" });
        return;
      }

      setStatus({
        type: "success",
        message: "导入成功！",
        agentId: data.agent.id,
        agentName: data.agent.name,
      });
    } catch {
      setStatus({ type: "error", message: "网络错误，请稍后重试" });
    }
  };

  const goToChat = () => {
    if (status.agentId) {
      router.push(`/chat/${status.agentId}`);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">导入角色 Agent</CardTitle>
        <CardDescription>
          粘贴包含 <code className="px-1.5 py-0.5 bg-secondary rounded text-sm">agent.json</code> 配置文件的
          GitHub 仓库链接，一键导入到角色广场。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL Input */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="https://github.com/user/agent-repo"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (status.type !== "idle") setStatus({ type: "idle" });
              }}
              disabled={status.type === "loading"}
              className={urlError ? "border-destructive" : ""}
            />
            {urlError && (
              <p className="text-xs text-destructive mt-1">{urlError}</p>
            )}
          </div>
          <Button
            onClick={handleImport}
            disabled={!url.trim() || !!urlError || status.type === "loading"}
          >
            {status.type === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                导入中
              </>
            ) : (
              "导入"
            )}
          </Button>
        </div>

        {/* Status messages */}
        {status.type === "loading" && (
          <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            {status.message}
          </div>
        )}

        {status.type === "success" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm text-green-700 dark:text-green-300">
              <CheckCircle2 className="w-4 h-4" />
              {status.message}
            </div>
            <Button onClick={goToChat} className="w-full">
              去和 {status.agentName} 聊天
            </Button>
          </div>
        )}

        {status.type === "error" && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{status.message}</span>
          </div>
        )}

        {/* Help section */}
        {status.type === "idle" && (
          <div className="p-4 bg-secondary/30 rounded-lg text-sm space-y-2">
            <p className="font-medium">如何创建可导入的 Agent？</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>
                Fork{" "}
                <a
                  href="https://github.com/liang-pron/agent-chat-template"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-inline-flex items-center gap-1"
                >
                  模板仓库 <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
              <li>编辑 <code className="px-1 bg-secondary rounded">agent.json</code> 填入角色信息</li>
              <li>粘贴你 fork 的仓库链接到这里</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
