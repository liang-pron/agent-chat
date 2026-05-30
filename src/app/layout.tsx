import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Bot, Sparkles } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentPlaza — AI 角色扮演广场",
  description: "从 GitHub 一键导入 AI 角色，即刻开始聊天",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&family=Orbitron:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col" style={{ backgroundColor: "#070b1a" }}>
        {/* Navbar — glass effect */}
        <header className="sticky top-0 z-50 glass border-b-0">
          <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <Sparkles className="w-5 h-5 text-[#00e5ff] animate-neon-pulse" />
              </div>
              <span
                className="text-lg tracking-wider uppercase"
                style={{ fontFamily: "'Orbitron', sans-serif", color: "#00e5ff" }}
              >
                AgentPlaza
              </span>
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/import">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-[#00e5ff30] text-[#00e5ff] hover:bg-[#00e5ff10] hover:border-[#00e5ff60] transition-all duration-300"
                >
                  <PlusCircle className="w-4 h-4" />
                  导入角色
                </Button>
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-5 py-6 w-full">{children}</main>

        <footer className="border-t border-[#1e2756]">
          <div className="max-w-7xl mx-auto px-5 py-4 text-center text-xs" style={{ color: "#4a5078" }}>
            AgentPlaza · AI 角色扮演广场
          </div>
        </footer>
      </body>
    </html>
  );
}
