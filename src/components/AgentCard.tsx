"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { AgentEditDialog } from "@/components/AgentEditDialog";
import type { AgentWithCount } from "@/lib/agent-registry";

const CATEGORY_STYLES: Record<string, { dot: string; label: string }> = {
  教育: { dot: "#5db872", label: "#3d3d3a" },
  科技: { dot: "#cc785c", label: "#3d3d3a" },
  娱乐: { dot: "#c64545", label: "#3d3d3a" },
  商业: { dot: "#e8a55a", label: "#3d3d3a" },
  生活方式: { dot: "#5db8a6", label: "#3d3d3a" },
  游戏: { dot: "#cc785c", label: "#3d3d3a" },
  其他: { dot: "#8e8b82", label: "#3d3d3a" },
};

export function AgentCard({ agent, onUpdate }: { agent: AgentWithCount; onUpdate: () => void }) {
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cat = CATEGORY_STYLES[agent.category] || CATEGORY_STYLES["其他"];

  const handleDelete = async () => {
    setDeleting(true);
    try { await fetch(`/api/agents/${agent.id}`, { method: "DELETE" }); onUpdate(); }
    catch {} finally { setDeleting(false); setConfirmDelete(false); }
  };

  const initials = agent.name.slice(0, 2);

  return (
    <>
      <div className="group relative">
        <Link href={`/chat/${agent.id}`} className="block">
          <div
            className="rounded-xl overflow-hidden transition-all duration-300 ease-out cursor-pointer"
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--hairline)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.borderColor = "var(--primary)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(20,20,19,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "var(--hairline)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div className="p-6 flex flex-col gap-4">
              {/* Top: avatar + name */}
              <div className="flex items-center gap-3.5">
                <Avatar className="h-11 w-11 shrink-0 ring-1 ring-offset-1"
                  style={{
                    "--tw-ring-offset-color": "var(--surface-card)",
                    "--tw-ring-color": "var(--hairline)",
                  } as React.CSSProperties}
                >
                  <AvatarImage src={agent.avatarUrl || undefined} />
                  <AvatarFallback
                    className="text-sm"
                    style={{ backgroundColor: "var(--surface-soft)", color: "var(--muted)" }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-lg truncate transition-colors duration-300"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.01em" }}
                  >
                    {agent.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-[12px]" style={{ color: "var(--muted)" }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: cat.dot }} />
                      {agent.category}
                    </span>
                    {agent._count.messages > 0 && (
                      <span className="text-[12px]" style={{ color: "var(--muted-soft)" }}>
                        {agent._count.messages} 条消息
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* Description */}
              <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "var(--body)" }}>
                {agent.description || "暂无简介"}
              </p>
            </div>
          </div>
        </Link>

        {/* Hover actions */}
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
          <button
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
            style={{ backgroundColor: "var(--surface-card)", color: "var(--muted)" }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowEdit(true); }}
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
            style={{ backgroundColor: "var(--surface-card)", color: "var(--muted)" }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(true); }}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Delete confirm overlay */}
        {confirmDelete && (
          <div
            className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-3 z-20"
            style={{ backgroundColor: "var(--canvas)", opacity: 0.96 }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <p className="text-sm" style={{ color: "var(--ink)" }}>删除「{agent.name}」？</p>
            <div className="flex gap-2">
              <Button size="sm" className="text-[13px] rounded-lg"
                style={{ backgroundColor: "var(--error)", color: "#fff" }}
                disabled={deleting}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(); }}
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "删除"}
              </Button>
              <Button size="sm" variant="outline" className="text-[13px] rounded-lg"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(false); }}
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </div>

      <AgentEditDialog
        open={showEdit} onClose={() => setShowEdit(false)}
        agent={{ id: agent.id, name: agent.name, avatarUrl: agent.avatarUrl }}
        onSaved={onUpdate}
      />
    </>
  );
}
