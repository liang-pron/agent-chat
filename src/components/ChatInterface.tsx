"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Settings, Key, Trash2, Loader2, ArrowDown, Save } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  agentId: string;
  sessionId: string;
  onAgentLoaded?: (name: string) => void;
}

export function ChatInterface({
  agentId,
  sessionId,
  onAgentLoaded,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [agentName, setAgentName] = useState("加载中...");
  const [agentAvatar, setAgentAvatar] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("user-deepseek-api-key") || "";
  });

  // Fetch agent info
  useEffect(() => {
    fetch(`/api/agents/${agentId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.agent) {
          setAgentName(d.agent.name);
          setAgentAvatar(d.agent.avatarUrl);
          onAgentLoaded?.(d.agent.name);
        }
      })
      .catch(() => setAgentName("未知"));
  }, [agentId]);

  // Load messages when session changes
  useEffect(() => {
    if (!sessionId) return;
    setMessages([]);
    setHistoryLoaded(false);
    fetch(`/api/agents/${agentId}/messages?sessionId=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages?.length > 0) {
          setMessages(data.messages);
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, [agentId, sessionId]);

  const handleClearHistory = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/agents/${agentId}/messages?sessionId=${sessionId}`, {
        method: "DELETE",
      });
      setMessages([]);
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  const scrollToBottom = useCallback((force = false) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (force || isNearBottom()) {
      el.scrollTop = el.scrollHeight;
    }
  }, [isNearBottom]);

  // Detect manual scroll
  const handleScroll = useCallback(() => {
    setUserScrolledUp(!isNearBottom());
  }, [isNearBottom]);

  // Auto-scroll on new messages (only if user hasn't scrolled up)
  useEffect(() => {
    if (!userScrolledUp) {
      scrollToBottom(true);
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || isLoading) return;

    // ─── Slash commands for file operations ───
    if (content.startsWith("/read ") || content.startsWith("/cat ")) {
      const fname = content.split(/\s+/).slice(1).join(" ");
      if (!fname) return;
      const ws = localStorage.getItem("fs-workspace") || "";
      try {
        const res = await fetch(`/api/fs?workspace=${encodeURIComponent(ws)}&path=${encodeURIComponent(fname)}&read=1`);
        const data = await res.json();
        if (res.ok) {
          setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content }, { id: crypto.randomUUID(), role: "assistant", content: `📄 **${fname}**\n\`\`\`\n${data.content || "(空文件)"}\n\`\`\`` }]);
        } else {
          setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content }, { id: crypto.randomUUID(), role: "assistant", content: `❌ 读取失败: ${data.error || "文件不存在"}` }]);
        }
      } catch { setError("文件操作失败"); }
      setInput(""); return;
    }

    if (content.startsWith("/write ") || content.startsWith("/save ")) {
      const parts = content.split(/\s+/).slice(1);
      if (parts.length < 2) { setError("用法: /write 文件名 内容..."); return; }
      const fname = parts[0];
      const body = parts.slice(1).join(" ");
      const ws = localStorage.getItem("fs-workspace") || "";
      const save = (window as unknown as Record<string, Function>).__fsSave;
      if (save) { save(fname, body); setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content }, { id: crypto.randomUUID(), role: "assistant", content: `✅ 已写入 **${fname}**` }]); }
      else {
        try {
          const res = await fetch(`/api/fs?workspace=${encodeURIComponent(ws)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: fname, content: body }) });
          const data = await res.json();
          setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content }, { id: crypto.randomUUID(), role: "assistant", content: res.ok ? `✅ 已写入 **${fname}**` : `❌ 写入失败: ${(data as { error?: string }).error}` }]);
        } catch { setError("文件操作失败"); }
      }
      setInput(""); return;
    }

    if (content.startsWith("/ls") || content.startsWith("/dir")) {
      const ws = localStorage.getItem("fs-workspace") || "";
      try {
        const res = await fetch(`/api/fs?workspace=${encodeURIComponent(ws)}`);
        const data = await res.json();
        if (res.ok) {
          const list = (data.files as { name: string; type: string }[]).map((f) => `${f.type === "dir" ? "📁" : "📄"} ${f.name}`).join("\n");
          setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content }, { id: crypto.randomUUID(), role: "assistant", content: `**工作目录:** ${data.workspace}\n\`\`\`\n${list || "(空目录)"}\n\`\`\`` }]);
        } else {
          setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content }, { id: crypto.randomUUID(), role: "assistant", content: `❌ ${data.error}` }]);
        }
      } catch { setError("文件操作失败"); }
      setInput(""); return;
    }

    // Normal chat message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError(null);
    setIsLoading(true);
    setUserScrolledUp(false); // reset scroll on new message

    const apiMessages = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await fetch(`/api/agents/${agentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          sessionId,
          apiKey,
          workspace: localStorage.getItem("fs-workspace") || "",
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "请求失败");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法读取响应");

      const assistantId = crypto.randomUUID();
      let assistantContent = "";

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: assistantContent } : m
          )
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "聊天出错");
    } finally {
      setIsLoading(false);
    }
  };

  const initials = agentName.slice(0, 2);

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Avatar className="h-10 w-10">
          <AvatarImage src={agentAvatar || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold">{agentName}</h2>
          <p className="text-xs text-muted-foreground">AI 角色扮演</p>
        </div>
        <div className="flex-1" />
        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            disabled={deleting}
            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="删除当前对话"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        )}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            "p-2 rounded-lg transition-colors",
            showSettings
              ? "bg-primary/10 text-primary"
              : "hover:bg-secondary text-muted-foreground"
          )}
          title="设置 API Key"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="px-4 py-3 border-b bg-secondary/30 space-y-2">
          <p className="text-xs font-medium flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" />
            设置你的 API Key（存在浏览器本地）
          </p>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => {
                const val = e.target.value;
                setApiKey(val);
                localStorage.setItem("user-deepseek-api-key", val);
              }}
              className="h-8 text-sm font-mono"
            />
            {apiKey && (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-xs text-muted-foreground"
                onClick={() => {
                  setApiKey("");
                  localStorage.removeItem("user-deepseek-api-key");
                }}
              >
                清除
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Messages area */}
      <ScrollArea className="flex-1 min-h-0 p-4" ref={scrollContainerRef} onScroll={handleScroll}>
        <div className="space-y-6 max-w-3xl mx-auto">
          {!historyLoaded ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20">
              <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-primary/10">
                <AvatarImage src={agentAvatar || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-semibold mb-2">{agentName}</h3>
              <p className="text-muted-foreground text-sm">
                开始和 {agentName} 聊天吧！
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={msg.id || i}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <Avatar className="h-8 w-8 shrink-0 mt-1">
                    <AvatarImage src={agentAvatar || undefined} />
                    <AvatarFallback className="text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-secondary-foreground rounded-bl-md prose prose-sm dark:prose-invert max-w-none"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        pre: ({ children }) => {
                          const codeEl = children as React.ReactElement<{ children?: string }> | undefined;
                          const codeText = typeof codeEl?.props?.children === "string" ? codeEl.props.children : "";
                          return (
                            <div className="relative group/pre my-2">
                              <pre className="bg-muted/50 rounded-lg p-3 pr-16 overflow-x-auto text-xs">{children}</pre>
                              {codeText && (
                                <button
                                  className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-background/80 hover:bg-primary hover:text-primary-foreground opacity-0 group-hover/pre:opacity-100 transition-all"
                                  onClick={() => {
                                    const fname = prompt("保存为文件（输入路径，如 readme.md）：", "output.md");
                                    if (fname && confirm(`写入文件: ${fname}？`)) {
                                      const save = (window as unknown as Record<string, Function>).__fsSave;
                                      if (save) save(fname, codeText);
                                      else {
                                        fetch("/api/fs", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ path: fname, content: codeText }),
                                        }).then(() => alert("已保存: " + fname)).catch(() => alert("保存失败"));
                                      }
                                    }
                                  }}
                                >
                                  <Save className="w-3 h-3" />保存
                                </button>
                              )}
                            </div>
                          );
                        },
                        code: ({ className, children, ...props }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="bg-muted/50 rounded px-1 py-0.5 text-xs" {...props}>{children}</code>
                          ) : (
                            <code className={className} {...props}>{children}</code>
                          );
                        },
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-2">
                            <table className="w-full border-collapse text-xs">{children}</table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="border px-2 py-1 bg-muted/30 text-left font-medium">{children}</th>
                        ),
                        td: ({ children }) => (
                          <td className="border px-2 py-1">{children}</td>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === "user" && (
                  <Avatar className="h-8 w-8 shrink-0 mt-1">
                    <AvatarFallback className="bg-primary/20 text-xs font-bold">
                      我
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0 mt-1">
                <AvatarFallback className="text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center p-4 bg-destructive/10 rounded-xl text-sm text-destructive">
              出错了：{error}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Jump to bottom button */}
      {userScrolledUp && (
        <button
          onClick={() => { scrollToBottom(true); setUserScrolledUp(false); }}
          className="absolute bottom-20 right-4 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all z-10"
          title="回到底部"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t bg-background/95 backdrop-blur"
      >
        <div className="flex gap-3 max-w-3xl mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`跟 ${agentName} 说点什么...`}
            className="min-h-[48px] max-h-[160px] resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) handleSubmit(e);
              }
            }}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            发送
          </Button>
        </div>
      </form>
    </div>
  );
}
