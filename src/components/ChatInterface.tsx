"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Settings, Key, Trash2, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  agentId: string;
  agentName: string;
  agentAvatar?: string | null;
}

export function ChatInterface({ agentId, agentName, agentAvatar }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("user-deepseek-api-key") || "";
  });

  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return "";
    let sid = sessionStorage.getItem(`chat-session-${agentId}`);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(`chat-session-${agentId}`, sid);
    }
    return sid;
  });

  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load existing messages from DB on mount
  useEffect(() => {
    if (!sessionId) return;
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

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || isLoading) return;

    // Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError(null);
    setIsLoading(true);

    // Prepare messages array for API
    const apiMessages = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await fetch(`/api/agents/${agentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, sessionId, apiKey }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "请求失败");
      }

      // Read streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法读取响应");

      const assistantId = crypto.randomUUID();
      let assistantContent = "";

      // Add empty assistant message that we'll update
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

        // Update the assistant message in place
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: assistantContent } : m
          )
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "聊天出错，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const initials = agentName.slice(0, 2);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
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
            title="清除对话记录"
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
            设置你的 API Key（存在浏览器本地，不会上传到服务器）
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
          <p className="text-xs text-muted-foreground">
            使用你自己的 DeepSeek API Key 来聊天，不消耗站点额度。
            <a
              href="https://platform.deepseek.com/api_keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline ml-1"
            >
              获取 Key →
            </a>
          </p>
        </div>
      )}

      {/* Messages area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.length === 0 && (
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
          )}

          {messages.map((msg, i) => (
            <div
              key={msg.id || i}
              className={cn(
                "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
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
                  "rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-secondary-foreground rounded-bl-md"
                )}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <Avatar className="h-8 w-8 shrink-0 mt-1">
                  <AvatarFallback className="bg-primary/20 text-xs font-bold">
                    我
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3 animate-in fade-in">
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

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
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
                if (input.trim()) {
                  handleSubmit(e);
                }
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
