"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Plus, MessageSquare, Trash2, Pencil, Check, X, Loader2 } from "lucide-react";

interface SessionInfo {
  id: string;
  name: string;
  updatedAt: string;
  _count: { messages: number };
  messages: { content: string }[];
}

interface ConversationListProps {
  agentId: string;
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
}

export function ConversationList({
  agentId,
  activeSessionId,
  onSelectSession,
  onNewSession,
}: ConversationListProps) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchSessions = () => {
    fetch(`/api/agents/${agentId}/messages`)
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSessions(); }, [agentId]);
  // Refresh when switching sessions
  useEffect(() => { fetchSessions(); }, [activeSessionId]);

  const handleDelete = async (sessionId: string) => {
    await fetch(`/api/agents/${agentId}/messages?sessionId=${sessionId}`, {
      method: "DELETE",
    });
    if (sessionId === activeSessionId) {
      onNewSession();
    }
    fetchSessions();
  };

  const handleRename = async (sessionId: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    await fetch(`/api/agents/${agentId}/messages`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, name: editName.trim() }),
    });
    setEditingId(null);
    setSaving(false);
    fetchSessions();
  };

  const startEdit = (s: SessionInfo) => {
    setEditingId(s.id);
    setEditName(s.name);
  };

  const preview = (s: SessionInfo) =>
    s.messages?.[0]?.content?.slice(0, 30) || "空对话";

  return (
    <div className="flex flex-col h-full border-r bg-background/50">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">对话列表</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNewSession} title="新建对话">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Session list */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 flex justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            还没有对话记录
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "group flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm cursor-pointer transition-colors",
                  s.id === activeSessionId
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-secondary"
                )}
                onClick={() => onSelectSession(s.id)}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  {editingId === s.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        className="flex-1 bg-background border rounded px-1 py-0.5 text-xs"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(s.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                      />
                      <button
                        className="p-0.5 hover:bg-green-100 rounded"
                        onClick={() => handleRename(s.id)}
                        disabled={saving}
                      >
                        <Check className="w-3 h-3 text-green-600" />
                      </button>
                      <button
                        className="p-0.5 hover:bg-red-100 rounded"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="truncate text-xs">{s.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {preview(s)}
                      </div>
                    </>
                  )}
                </div>

                {/* Actions — show on hover */}
                {editingId !== s.id && (
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button
                      className="p-0.5 hover:bg-secondary rounded"
                      onClick={(e) => { e.stopPropagation(); startEdit(s); }}
                      title="重命名"
                    >
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </button>
                    <button
                      className="p-0.5 hover:bg-destructive/10 rounded"
                      onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                      title="删除"
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
