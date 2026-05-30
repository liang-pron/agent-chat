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
    <div className="flex h-[calc(100vh-8rem)] -mx-4 -my-6 -mr-6">
      {/* Sidebar */}
      <div className="flex border-r -ml-4" style={{ borderColor: "var(--hairline)", backgroundColor: "var(--canvas)" }}>
        {/* Toggle button */}
        <div className="flex flex-col items-center pt-1.5 px-0.5">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
            title={sidebarOpen ? "收起" : "展开"}
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8 mt-1">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {sidebarOpen && (
          <div className="w-44 shrink-0">
            <ConversationList
              agentId={agentId}
              activeSessionId={sessionId}
              onSelectSession={handleSelectSession}
              onNewSession={handleNewSession}
            />
          </div>
        )}
      </div>

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
