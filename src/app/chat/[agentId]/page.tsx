"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChatInterface } from "@/components/ChatInterface";
import { ConversationList } from "@/components/ConversationList";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PanelLeftClose, PanelLeft } from "lucide-react";

export default function ChatPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessionId, setSessionId] = useState(() => {
    if (typeof window === "undefined") return "";
    let sid = sessionStorage.getItem(`chat-session-${agentId}`);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(`chat-session-${agentId}`, sid);
    }
    return sid;
  });
  const [agentName, setAgentName] = useState("");

  const handleSelectSession = useCallback((sid: string) => {
    setSessionId(sid);
    sessionStorage.setItem(`chat-session-${agentId}`, sid);
  }, [agentId]);

  const handleNewSession = useCallback(() => {
    const sid = crypto.randomUUID();
    setSessionId(sid);
    sessionStorage.setItem(`chat-session-${agentId}`, sid);
  }, [agentId]);

  return (
    <div className="flex h-[calc(100vh-8rem)] -mx-4">
      {/* Sidebar toggle + back button */}
      <div className="absolute top-2 left-2 z-20 flex items-center gap-1">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
          title={sidebarOpen ? "收起侧边栏" : "展开侧边栏"}
        >
          {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
        </button>
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1.5 h-8">
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
        </Link>
      </div>

      {/* Conversation sidebar */}
      {sidebarOpen && (
        <div className="w-64 shrink-0">
          <ConversationList
            agentId={agentId}
            activeSessionId={sessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
          />
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatInterface
          agentId={agentId}
          sessionId={sessionId}
          onAgentLoaded={setAgentName}
        />
      </div>
    </div>
  );
}
