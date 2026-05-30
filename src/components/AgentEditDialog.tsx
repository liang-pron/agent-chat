"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Loader2, Upload, Plus, ChevronDown } from "lucide-react";

interface AgentEditDialogProps {
  open: boolean;
  onClose: () => void;
  agent: { id: string; name: string; avatarUrl: string | null; category: string; document?: string; systemPrompt?: string };
  onSaved: () => void;
}

export function AgentEditDialog({ open, onClose, agent, onSaved }: AgentEditDialogProps) {
  const [name, setName] = useState(agent.name);
  const [avatarUrl, setAvatarUrl] = useState(agent.avatarUrl || "");
  const [category, setCategory] = useState(agent.category);
  const [document, setDocument] = useState(agent.document || "");
  const [systemPrompt, setSystemPrompt] = useState(agent.systemPrompt || "");
  const [showSkillImport, setShowSkillImport] = useState(false);
  const [skillUrl, setSkillUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CATEGORIES = ["教育", "科技", "娱乐", "商业", "生活方式", "游戏", "其他"];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上传失败");

      setAvatarUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  // Import skill from URL or file and append to system prompt
  const handleImportSkill = async (source: "url" | "file", file?: File) => {
    setImporting(true);
    setError(null);
    try {
      let content = "";
      if (source === "url" && skillUrl.trim()) {
        const res = await fetch("/api/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ githubUrl: skillUrl.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "导入失败");
        // Fetch the agent's full system prompt
        const agentRes = await fetch(`/api/agents/${data.agent?.id || agent.id}`);
        const agentData = await agentRes.json();
        content = agentData.agent?.systemPrompt || "";
      } else if (source === "file" && file) {
        content = await file.text();
        const parsed = content.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
        if (parsed) content = parsed[1].trim();
      }

      if (content) {
        setSystemPrompt((prev) => prev + "\n\n---\n\n" + content);
        setSkillUrl("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "导入失败");
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("角色名不能为空");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          avatarUrl: avatarUrl.trim() || null,
          category,
          document,
          systemPrompt,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "更新失败");
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败");
    } finally {
      setSaving(false);
    }
  };

  // Reset state when dialog opens with new agent
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setName(agent.name);
      setCategory(agent.category);
      setDocument(agent.document || "");
      setSystemPrompt(agent.systemPrompt || "");
      setAvatarUrl(agent.avatarUrl || "");
      setError(null);
    } else {
      onClose();
    }
  };

  const initials = name.slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑角色</DialogTitle>
          <DialogDescription>修改角色名称和头像</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Avatar preview */}
          <div className="flex justify-center">
            <Avatar className="h-20 w-20 ring-4 ring-primary/10">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="edit-name">角色名称</label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入角色名"
              maxLength={50}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label htmlFor="edit-category" className="text-sm font-medium">领域分类</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                    category === cat
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-background text-muted-foreground border-border hover:border-emerald-300"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Import additional skill */}
          <div className="border rounded-lg">
            <button
              type="button"
              onClick={() => setShowSkillImport(!showSkillImport)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-secondary/50 rounded-lg transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                导入新 skill 到当前角色
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showSkillImport ? "rotate-180" : ""}`} />
            </button>

            {showSkillImport && (
              <div className="px-3 pb-3 space-y-2 border-t">
                {/* URL import */}
                <div className="flex gap-2 pt-2">
                  <input
                    placeholder="粘贴 GitHub 链接或 SKILL.md URL"
                    value={skillUrl}
                    onChange={(e) => setSkillUrl(e.target.value)}
                    className="flex-1 h-8 rounded-lg border border-input bg-background px-2.5 text-xs"
                  />
                  <button
                    onClick={() => handleImportSkill("url")}
                    disabled={!skillUrl.trim() || importing}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {importing ? "导入中" : "导入"}
                  </button>
                </div>

                {/* File import */}
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  <Upload className="w-3 h-3" />
                  或从本地文件导入
                  <input
                    type="file"
                    accept=".md"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImportSkill("file", f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Document */}
          <div className="space-y-1.5">
            <label htmlFor="edit-doc" className="text-sm font-medium">
              文档介绍（Markdown）
            </label>
            <textarea
              id="edit-doc"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              placeholder="## 简介&#10;&#10;这个角色的详细说明...&#10;&#10;## 使用场景&#10;&#10;- 场景1&#10;- 场景2"
              rows={5}
              className="w-full min-h-[100px] rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono resize-y"
            />
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs cursor-pointer hover:bg-secondary transition-colors">
                <Upload className="w-3 h-3" />
                导入本地 md 文件
                <input
                  type="file"
                  accept=".md"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = () => setDocument(reader.result as string);
                    reader.readAsText(f);
                    e.target.value = "";
                  }}
                />
              </label>
              {document && (
                <button
                  onClick={() => setDocument("")}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >清除文档</button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              支持 Markdown 格式，导入 GitHub 仓库时自动拉取 README.md
            </p>
          </div>

          {/* Avatar URL */}
          <div className="space-y-1.5">
            <label htmlFor="edit-avatar" className="text-sm font-medium">
              头像链接（可选）
            </label>
            <div className="flex gap-2">
              <Input
                id="edit-avatar"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="flex-1"
              />
              <label
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-colors shrink-0",
                  uploading
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-background hover:bg-secondary"
                )}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                本地上传
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              粘贴 URL 或从本地上传图片（最大 2MB），留空显示角色名首字
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                保存中
              </>
            ) : (
              "保存"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
