"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { ChatInterface } from "@/components/ChatInterface";
import { ConversationList } from "@/components/ConversationList";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, PanelLeftClose, PanelLeft, MessageCircle, BookOpen } from "lucide-react";

export default function ChatPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tab, setTab] = useState<"chat" | "docs">("chat");
  const [agentDoc, setAgentDoc] = useState("");
  const [agentName, setAgentName] = useState("");
  const [sessionId, setSessionId] = useState(() => {
    if (typeof window === "undefined") return "";
    let sid = sessionStorage.getItem(`chat-session-${agentId}`);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(`chat-session-${agentId}`, sid);
    }
    return sid;
  });

  // Fetch agent document
  useEffect(() => {
    fetch(`/api/agents/${agentId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.agent) {
          setAgentDoc(d.agent.document || "");
          setAgentName(d.agent.name);
        }
      })
      .catch(() => {});
  }, [agentId]);

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
      <div className="flex border-r bg-background/50 -ml-4">
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

        {sidebarOpen && tab === "chat" && (
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

      {/* Tab bar + content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab switcher */}
        <div className="flex items-center gap-1 px-4 py-2 border-b bg-background/50">
          <button
            onClick={() => setTab("chat")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === "chat" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <MessageCircle className="w-4 h-4" />聊天
          </button>
          <button
            onClick={() => setTab("docs")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === "docs" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <BookOpen className="w-4 h-4" />文档
          </button>
        </div>

        {/* Content */}
        {tab === "chat" ? (
          <div className="flex-1">
            <ChatInterface
              agentId={agentId}
              sessionId={sessionId}
              onAgentLoaded={setAgentName}
            />
          </div>
        ) : (
          <ScrollArea className="flex-1 p-6">
            {agentDoc ? (
              <div className="max-w-3xl mx-auto prose prose-sm dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    pre: ({ children }) => (
                      <pre className="bg-muted/50 rounded-lg p-4 my-3 overflow-x-auto text-sm">{children}</pre>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-3"><table className="w-full border-collapse text-sm">{children}</table></div>
                    ),
                    th: ({ children }) => <th className="border px-2 py-1 bg-muted/30 text-left font-medium">{children}</th>,
                    td: ({ children }) => <td className="border px-2 py-1">{children}</td>,
                  }}
                >
                  {agentDoc}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">还没有文档介绍</p>
                <p className="text-xs mt-1">点击角色卡片上的编辑按钮，在文档栏填写介绍内容</p>
              </div>
            )}
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
