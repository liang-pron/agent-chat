"use client";

import { useState, useEffect, useCallback } from "react";
import { AgentCard } from "@/components/AgentCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgentWithCount } from "@/lib/agent-registry";
import { Bot } from "lucide-react";

export default function HomePage() {
  const [agents, setAgents] = useState<AgentWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("全部");

  const fetchAgents = useCallback(async (cat: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = cat !== "全部" ? `?category=${encodeURIComponent(cat)}` : "";
      const res = await fetch(`/api/agents${params}`);
      if (!res.ok) throw new Error("加载失败");
      const data = await res.json();
      setAgents(data.agents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载角色列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents(category);
  }, [category, fetchAgents]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-bold tracking-tight">
          <Bot className="w-12 h-12 mx-auto mb-4 text-emerald-600" />
          AI 角色扮演广场
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          从 GitHub 粘贴一个链接，导入 AI 角色，即刻开始聊天。
          <br />
          张雪峰、老罗、甄嬛……你可以跟任何人聊天。
        </p>
      </div>

      {/* Category filter */}
      <CategoryFilter active={category} onChange={setCategory} />

      {/* Agent grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <Bot className="w-16 h-16 mx-auto text-muted-foreground/40" />
          <h3 className="text-xl font-semibold text-muted-foreground">
            {category === "全部" ? "广场还是空的" : `还没有「${category}」分类的角色`}
          </h3>
          <p className="text-muted-foreground text-sm">
            去导入第一个角色吧！
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onUpdate={() => fetchAgents(category)} />
          ))}
        </div>
      )}
    </div>
  );
}
