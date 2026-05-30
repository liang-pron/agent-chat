"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, ExternalLink, Upload, FileText, Search, CheckSquare, Square } from "lucide-react";

interface ScanFile { path: string; name: string; description: string }
interface BulkResult { path: string; name: string; status: "ok" | "skip" | "fail"; reason?: string }
interface ImportStatus {
  type: "idle" | "scanning" | "preview" | "loading" | "success" | "error" | "bulk";
  message?: string;
  agentId?: string;
  agentName?: string;
  scanFiles?: ScanFile[];
  bulkResults?: { total: number; okCount: number; skipCount: number; failCount: number; results: BulkResult[]; merge?: boolean };
}

export function ImportForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<ImportStatus>({ type: "idle" });
  const [file, setFile] = useState<File | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  const urlError =
    url && !url.match(/^https:\/\/github\.com\/[^/]+\/[^/]+/)
      ? "请输入有效的 GitHub 仓库链接"
      : "";

  // ─── Scan repo for SKILL.md files ───
  const handleScan = async () => {
    if (!url.trim() || urlError) return;
    setStatus({ type: "scanning", message: "正在扫描仓库..." });

    try {
      const res = await fetch(`/api/import/scan?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (!res.ok) { setStatus({ type: "error", message: data.error || "扫描失败" }); return; }

      const paths = new Set<string>(data.files.map((f: ScanFile) => f.path));
      setSelectedPaths(paths);
      setStatus({ type: "preview", scanFiles: data.files, message: `找到 ${data.total} 个 SKILL.md` });
    } catch {
      setStatus({ type: "error", message: "扫描失败，请稍后重试" });
    }
  };

  const togglePath = (path: string) => {
    const next = new Set(selectedPaths);
    next.has(path) ? next.delete(path) : next.add(path);
    setSelectedPaths(next);
  };

  const toggleAll = () => {
    if (status.scanFiles && selectedPaths.size === status.scanFiles.length) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(status.scanFiles?.map((f) => f.path) || []));
    }
  };

  // ─── Execute import ───
  const handleBulkImport = async () => {
    if (selectedPaths.size === 0) return;
    setStatus({ type: "loading", message: mergeMode ? "正在融合导入..." : "正在批量导入..." });

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUrl: url.trim(),
          merge: mergeMode,
          selectedPaths: [...selectedPaths],
        }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus({ type: "error", message: data.error || "导入失败" }); return; }

      if (data.bulk) {
        setStatus({ type: "bulk", message: `导入了 ${data.okCount} 个角色`, bulkResults: data });
      } else {
        setStatus({ type: "success", message: "导入成功！", agentId: data.agent?.id, agentName: data.agent?.name });
      }
    } catch {
      setStatus({ type: "error", message: "网络错误，请稍后重试" });
    }
  };

  // ─── Single URL / File import ───
  const handleUrlImport = async () => {
    if (!url.trim() || urlError) return;
    const isDirectMd = url.trim().endsWith(".md") || url.includes("raw.");
    setStatus({ type: "loading", message: isDirectMd ? "正在获取 SKILL.md..." : "正在从 GitHub 导入..." });
    try {
      const res = await fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ githubUrl: url.trim() }) });
      const data = await res.json();
      if (!res.ok) { setStatus({ type: "error", message: data.error || "导入失败" }); return; }
      if (data.bulk) {
        setStatus({ type: "bulk", message: data.okCount + " 个角色", bulkResults: data });
      } else {
        setStatus({ type: "success", message: "导入成功！", agentId: data.agent.id, agentName: data.agent.name });
      }
    } catch { setStatus({ type: "error", message: "网络错误" }); }
  };

  const handleFileImport = async () => {
    if (!file) return;
    setStatus({ type: "loading", message: "正在解析 SKILL.md..." });
    try {
      const formData = new FormData(); formData.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setStatus({ type: "error", message: data.error || "导入失败" }); return; }
      setStatus({ type: "success", message: "导入成功！", agentId: data.agent.id, agentName: data.agent.name });
    } catch { setStatus({ type: "error", message: "网络错误" }); }
  };

  const goToChat = () => { if (status.agentId) router.push(`/chat/${status.agentId}`); };
  const reset = () => { setStatus({ type: "idle" }); setSelectedPaths(new Set()); };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">导入角色 Agent</CardTitle>
        <CardDescription>
          粘贴 GitHub 仓库链接、SKILL.md 直链，或直接上传本地文件
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL Input + Scan button */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="https://github.com/owner/repo"
              value={url}
              onChange={(e) => { setUrl(e.target.value); if (status.type !== "idle" && status.type !== "preview") reset(); }}
              disabled={["loading", "scanning"].includes(status.type)}
              className={urlError ? "border-destructive" : ""}
            />
            {urlError && <p className="text-xs text-destructive mt-1">{urlError}</p>}
          </div>
          <Button onClick={handleScan} disabled={!url.trim() || !!urlError || ["loading", "scanning"].includes(status.type)} variant="outline" className="gap-1.5">
            <Search className="w-4 h-4" />扫描
          </Button>
          <Button onClick={handleUrlImport} disabled={!url.trim() || !!urlError || ["loading", "scanning"].includes(status.type)}>
            导入
          </Button>
        </div>

        {/* Scanning indicator */}
        {status.type === "scanning" && (
          <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />{status.message}
          </div>
        )}

        {/* Preview panel — scan results with checkboxes + merge toggle */}
        {status.type === "preview" && status.scanFiles && (
          <div className="space-y-3 border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">找到 {status.scanFiles.length} 个 SKILL.md</span>
              <div className="flex items-center gap-3">
                {/* Merge toggle */}
                <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                  <input type="checkbox" checked={mergeMode} onChange={(e) => setMergeMode(e.target.checked)} className="w-3.5 h-3.5" />
                  融合为一个
                </label>
                <button onClick={toggleAll} className="text-xs text-primary hover:underline">
                  {selectedPaths.size === status.scanFiles.length ? "取消全选" : "全选"}
                </button>
              </div>
            </div>

            {mergeMode ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-xs text-amber-800 dark:text-amber-200">
                所有选中的 SKILL.md 将融合为一个角色，system prompt 分段合并。
              </div>
            ) : null}

            <div className="max-h-64 overflow-y-auto space-y-0.5 border rounded-lg">
              {status.scanFiles.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 cursor-pointer text-xs"
                  onClick={() => togglePath(f.path)}
                >
                  {selectedPaths.has(f.path)
                    ? <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    : <Square className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  <span className="font-medium truncate">{f.name}</span>
                  <span className="text-muted-foreground truncate">{f.path}</span>
                </div>
              ))}
            </div>

            <Button onClick={handleBulkImport} disabled={selectedPaths.size === 0} className="w-full">
              {mergeMode ? `融合导入 ${selectedPaths.size} 个 SKILL.md` : `分别导入 ${selectedPaths.size} 个角色`}
            </Button>
          </div>
        )}

        {/* Status messages */}
        {status.type === "loading" && (
          <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg text-sm"><Loader2 className="w-4 h-4 animate-spin" />{status.message}</div>
        )}
        {status.type === "success" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-sm text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="w-4 h-4" />{status.message}</div>
            <Button onClick={goToChat} className="w-full">去和 {status.agentName} 聊天</Button>
          </div>
        )}
        {status.type === "error" && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm text-destructive"><XCircle className="w-4 h-4 shrink-0" /><span>{status.message}</span></div>
        )}
        {status.type === "bulk" && status.bulkResults && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
              {status.bulkResults.merge ? "融合导入完成！" : `批量导入完成：${status.bulkResults.okCount} 成功${status.bulkResults.skipCount > 0 ? `，${status.bulkResults.skipCount} 跳过` : ""}${status.bulkResults.failCount > 0 ? `，${status.bulkResults.failCount} 失败` : ""}`}
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
              {status.bulkResults.results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 rounded">
                  {r.status === "ok" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  {r.status === "skip" && <span className="w-3 h-3 text-amber-500 shrink-0">⊘</span>}
                  {r.status === "fail" && <XCircle className="w-3 h-3 text-red-500 shrink-0" />}
                  <span className="font-medium truncate">{r.name}</span>
                  <span className="text-muted-foreground truncate">{r.path}</span>
                  {r.reason && <span className="text-muted-foreground ml-auto shrink-0">{r.reason}</span>}
                </div>
              ))}
            </div>
            <Button onClick={reset} variant="outline" className="w-full">继续导入</Button>
          </div>
        )}

        {/* Divider + file upload */}
        <div className="flex items-center gap-3"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">或者</span><div className="flex-1 h-px bg-border" /></div>
        <div className="space-y-2">
          <p className="text-sm font-medium">从本地文件导入 SKILL.md</p>
          <div className="flex gap-3">
            <label className={cn("flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors", file ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-background hover:bg-secondary")}>
              {file ? (<><FileText className="w-4 h-4 shrink-0" /><span className="truncate">{file.name}</span></>) : (<><Upload className="w-4 h-4 shrink-0 text-muted-foreground" /><span className="text-muted-foreground">选择 SKILL.md 文件</span></>)}
              <input type="file" accept=".md" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={["loading", "scanning"].includes(status.type)} />
            </label>
            <Button onClick={handleFileImport} disabled={!file || ["loading", "scanning"].includes(status.type)}>导入文件</Button>
          </div>
        </div>

        {/* Help section */}
        {status.type === "idle" && (
          <div className="p-4 bg-secondary/30 rounded-lg text-sm space-y-2">
            <p className="font-medium">如何创建可导入的 Agent？</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Fork <a href="https://github.com/liang-pron/agent-chat-template" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">模板仓库 <ExternalLink className="w-3 h-3 inline" /></a></li>
              <li>编辑 <code className="px-1 bg-secondary rounded">SKILL.md</code> 填入角色人设和对话规则</li>
              <li>粘贴你 fork 的仓库链接 → 点扫描 → 选择导入</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
