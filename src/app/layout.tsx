"use client";

import { useState, useEffect } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Sun, Moon } from "lucide-react";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) { setTheme(saved); document.documentElement.className = saved; }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.className = next;
    localStorage.setItem("theme", next);
  };

  return (
    <html lang="zh-CN" className={theme} suppressHydrationWarning>
      <head>
        <title>AgentPlaza — AI 角色扮演广场</title>
        <meta name="description" content="从 GitHub 一键导入 AI 角色，即刻开始聊天" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        {/* Nav — cream canvas + hairline bottom border */}
        <header
          className="sticky top-0 z-50 h-14 flex items-center border-b"
          style={{ backgroundColor: "var(--canvas)", borderColor: "var(--hairline)" }}
        >
          <div className="max-w-6xl mx-auto px-6 w-full flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span
                className="text-xl tracking-tight"
                style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "var(--ink)" }}
              >
                Agent<span style={{ color: "var(--primary)" }}>Plaza</span>
              </span>
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/import">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-[13px] font-medium"
                  style={{
                    borderColor: "var(--hairline)",
                    color: "var(--body)",
                    backgroundColor: "var(--canvas)",
                    borderRadius: "8px",
                  }}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  导入角色
                </Button>
              </Link>
              <button
                onClick={toggleTheme}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--surface-card)]"
                style={{ color: "var(--muted)" }}
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-6xl mx-auto px-6 py-8 w-full">{children}</main>

        <footer style={{ backgroundColor: "var(--surface-dark)", color: "var(--on-dark-soft)" }}>
          <div className="max-w-6xl mx-auto px-6 py-8 text-center text-xs">
            AgentPlaza · AI 角色扮演广场
          </div>
        </footer>
      </body>
    </html>
  );
}
