"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { AgentEditDialog } from "@/components/AgentEditDialog";
import type { Agent } from "@/generated/prisma/client";

const CATEGORY_COLORS: Record<string, string> = {
  教育: "bg-blue-100 text-blue-800",
  科技: "bg-purple-100 text-purple-800",
  娱乐: "bg-pink-100 text-pink-800",
  商业: "bg-amber-100 text-amber-800",
  生活方式: "bg-green-100 text-green-800",
  游戏: "bg-orange-100 text-orange-800",
  其他: "bg-gray-100 text-gray-800",
};

export function AgentCard({
  agent,
  onUpdate,
}: {
  agent: Agent;
  onUpdate: () => void;
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/agents/${agent.id}`, { method: "DELETE" });
      onUpdate();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const initials = agent.name.slice(0, 2);

  return (
    <>
      <Card className="group h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-2 hover:border-emerald-500/40 relative rounded-2xl">
        {/* Click area → chat */}
        <Link href={`/chat/${agent.id}`} className="block h-full">
          <CardContent className="p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all shrink-0">
                <AvatarImage src={agent.avatarUrl || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                  {agent.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    variant="secondary"
                    className={`text-xs px-1.5 py-0 ${CATEGORY_COLORS[agent.category] || CATEGORY_COLORS["其他"]}`}
                  >
                    {agent.category}
                  </Badge>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {agent.description || "暂无简介"}
            </p>
          </CardContent>
        </Link>

        {/* Action buttons — stop link navigation */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowEdit(true);
            }}
            title="编辑"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setConfirmDelete(true);
            }}
            title="删除"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Delete confirmation overlay */}
        {confirmDelete && (
          <div
            className="absolute inset-0 bg-background/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-2 z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <p className="text-sm font-medium">确定删除「{agent.name}」？</p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={deleting}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete();
                }}
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "删除"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirmDelete(false);
                }}
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit dialog */}
      <AgentEditDialog
        open={showEdit}
        onClose={() => setShowEdit(false)}
        agent={{ id: agent.id, name: agent.name, avatarUrl: agent.avatarUrl, category: agent.category, document: agent.document, systemPrompt: agent.systemPrompt }}
        onSaved={onUpdate}
      />
    </>
  );
}
