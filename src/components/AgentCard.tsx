"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Loader2, MessageCircle } from "lucide-react";
import { AgentEditDialog } from "@/components/AgentEditDialog";
import type { AgentWithCount } from "@/lib/agent-registry";

const CATEGORY_STYLES: Record<string, { bg: string; text: string; glow: string }> = {
  教育: { bg: "rgba(0,230,118,0.12)", text: "#00e676", glow: "0 0 8px rgba(0,230,118,0.15)" },
  科技: { bg: "rgba(0,229,255,0.12)", text: "#00e5ff", glow: "0 0 8px rgba(0,229,255,0.15)" },
  娱乐: { bg: "rgba(255,45,149,0.12)", text: "#ff2d95", glow: "0 0 8px rgba(255,45,149,0.15)" },
  商业: { bg: "rgba(255,183,77,0.12)", text: "#ffb74d", glow: "0 0 8px rgba(255,183,77,0.15)" },
  生活方式: { bg: "rgba(200,180,255,0.12)", text: "#c8b4ff", glow: "0 0 8px rgba(200,180,255,0.15)" },
  游戏: { bg: "rgba(255,100,180,0.12)", text: "#ff64b4", glow: "0 0 8px rgba(255,100,180,0.15)" },
  其他: { bg: "rgba(136,144,176,0.12)", text: "#8890b0", glow: "none" },
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
            className="relative overflow-hidden rounded-2xl transition-all duration-300 ease-out cursor-pointer"
            style={{
              background: "rgba(15,20,41,0.8)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(30,39,86,0.8)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
              e.currentTarget.style.borderColor = "rgba(0,229,255,0.4)";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(0,229,255,0.08), 0 8px 32px rgba(0,0,0,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.borderColor = "rgba(30,39,86,0.8)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Top glow line */}
            <div className="h-0.5 bg-gradient-to-r from-transparent via-[#00e5ff40] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="p-5 flex flex-col gap-4">
              {/* Avatar row */}
              <div className="flex items-center gap-3.5">
                <Avatar
                  className="h-12 w-12 shrink-0 ring-2 ring-offset-2 ring-offset-[#0f1429] transition-all duration-300 group-hover:ring-[#00e5ff40]"
                >
                  <AvatarImage src={agent.avatarUrl || undefined} />
                  <AvatarFallback
                    className="text-sm font-bold"
                    style={{ background: `linear-gradient(135deg, ${cat.text}20, ${cat.text}08)`, color: cat.text }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate transition-colors duration-300 group-hover:text-[#00e5ff]">
                    {agent.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: cat.bg, color: cat.text, boxShadow: cat.glow }}
                    >
                      {agent.category}
                    </span>
                    {agent._count.messages > 0 && (
                      <span className="text-xs flex items-center gap-1" style={{ color: "#4a5078" }}>
                        <MessageCircle className="w-3 h-3" />
                        {agent._count.messages}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* Description */}
              <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "#8890b0" }}>
                {agent.description || "暂无简介"}
              </p>
            </div>
          </div>
        </Link>

        {/* Hover actions */}
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 rounded-lg bg-[#0f1429]/90 hover:bg-[#161d3b]"
            style={{ color: "#8890b0" }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowEdit(true); }}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 rounded-lg bg-[#0f1429]/90 hover:bg-[#ff2d9515]"
            style={{ color: "#8890b0" }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(true); }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Delete confirm */}
        {confirmDelete && (
          <div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-3 z-20"
            style={{ background: "rgba(7,11,26,0.92)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <p className="text-sm font-medium">删除「{agent.name}」？</p>
            <div className="flex gap-2">
              <Button
                variant="destructive" size="sm" disabled={deleting}
                className="bg-[#ff2d95] hover:bg-[#ff2d95]/80"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(); }}
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "删除"}
              </Button>
              <Button
                variant="outline" size="sm"
                className="border-[#1e2756]"
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
