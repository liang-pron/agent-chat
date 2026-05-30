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
import { Loader2, Upload } from "lucide-react";

interface AgentEditDialogProps {
  open: boolean;
  onClose: () => void;
  agent: { id: string; name: string; avatarUrl: string | null };
  onSaved: () => void;
}

export function AgentEditDialog({ open, onClose, agent, onSaved }: AgentEditDialogProps) {
  const [name, setName] = useState(agent.name);
  const [avatarUrl, setAvatarUrl] = useState(agent.avatarUrl || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
