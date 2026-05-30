"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AgentWithCount } from "@/lib/agent-registry";

/** Category badge color mapping */
const CATEGORY_COLORS: Record<string, string> = {
  教育: "bg-blue-100 text-blue-800",
  科技: "bg-purple-100 text-purple-800",
  娱乐: "bg-pink-100 text-pink-800",
  商业: "bg-amber-100 text-amber-800",
  生活方式: "bg-green-100 text-green-800",
  游戏: "bg-orange-100 text-orange-800",
  其他: "bg-gray-100 text-gray-800",
};

export function AgentCard({ agent }: { agent: AgentWithCount }) {
  const initials = agent.name.slice(0, 2);

  return (
    <Link href={`/chat/${agent.id}`}>
      <Card className="group h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/30">
        <CardContent className="p-5 flex flex-col gap-3">
          {/* Avatar + Name */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
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
                {agent._count.messages > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {agent._count.messages} 条消息
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {agent.description || "暂无简介"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
