"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, ExternalLink, Upload, FileText } from "lucide-react";

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

  const [file, setFile] = useState<File | null>(null);

  const handleUrlImport = async () => {
    if (!url.trim() || urlError) return;
    const isDirectMd =
      url.trim().endsWith(".md") || url.includes("raw.");

    setStatus({ type: "loading", message: isDirectMd ? "正在获取 SKILL.md..." : "正在从 GitHub 导入..." });

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus({ type: "error", message: data.error || "导入失败" }); return; }
      setStatus({ type: "success", message: "导入成功！", agentId: data.agent.id, agentName: data.agent.name });
    } catch {
      setStatus({ type: "error", message: "网络错误，请稍后重试" });
    }
  };

  const handleFileImport = async () => {
    if (!file) return;
    setStatus({ type: "loading", message: "正在解析 SKILL.md..." });

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setStatus({ type: "error", message: data.error || "导入失败" }); return; }
      setStatus({ type: "success", message: "导入成功！", agentId: data.agent.id, agentName: data.agent.name });
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
          粘贴 GitHub 仓库链接、SKILL.md 直链，或直接上传本地文件，一键导入到角色广场。
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
            onClick={handleUrlImport}
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

        {/* Divider + file upload */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">或者</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">从本地文件导入 SKILL.md</p>
          <div className="flex gap-3">
            <label
              className={cn(
                "flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors",
                file
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-background hover:bg-secondary"
              )}
            >
              {file ? (
                <>
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">选择 SKILL.md 文件</span>
                </>
              )}
              <input
                type="file"
                accept=".md"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={status.type === "loading"}
              />
            </label>
            <Button
              onClick={handleFileImport}
              disabled={!file || status.type === "loading"}
            >
              {status.type === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  导入中
                </>
              ) : (
                "导入文件"
              )}
            </Button>
          </div>
        </div>

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
              <li>编辑 <code className="px-1 bg-secondary rounded">SKILL.md</code> 填入角色人设和对话规则</li>
              <li>粘贴你 fork 的仓库链接到这里</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
