"use client";

import { useState, useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Bot, Key, Check, Eye, EyeOff } from "lucide-react";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setApiKey(localStorage.getItem("user-deepseek-api-key") || "");
  }, []);

  const saveKey = () => {
    localStorage.setItem("user-deepseek-api-key", apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity shrink-0">
              <Bot className="w-6 h-6 text-primary" />
              AgentPlaza
            </Link>

            <div className="flex-1" />

            {/* API Key */}
            <div className="flex items-center gap-1.5">
              {showKeyInput ? (
                <>
                  <div className="relative">
                    <Input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="h-8 w-48 text-xs font-mono pr-8"
                      onKeyDown={(e) => { if (e.key === "Enter") saveKey(); if (e.key === "Escape") setShowKeyInput(false); }}
                      autoFocus
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button onClick={saveKey} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors" title="保存">
                    <Check className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowKeyInput(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    apiKey ? "bg-emerald-50 text-emerald-700" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                  title={apiKey ? "已设置 API Key" : "设置 API Key"}
                >
                  <Key className="w-3.5 h-3.5" />
                  {apiKey ? "Key 已设置" : "设置 Key"}
                </button>
              )}
              {saved && <span className="text-xs text-emerald-600 animate-in fade-in">已保存</span>}
            </div>

            <nav className="flex items-center gap-2 shrink-0">
              <Link href="/import">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <PlusCircle className="w-4 h-4" />
                  导入角色
                </Button>
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">{children}</main>

        <footer className="border-t">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
            AgentPlaza — 从 GitHub 导入 AI 角色，即刻聊天
          </div>
        </footer>
      </body>
    </html>
  );
}
