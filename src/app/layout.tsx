import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Bot } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentPlaza — AI 角色扮演广场",
  description: "从 GitHub 一键导入 AI 角色，即刻开始聊天",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-background flex flex-col">
        {/* Navigation */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity">
              <Bot className="w-6 h-6 text-primary" />
              AgentPlaza
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/import">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <PlusCircle className="w-4 h-4" />
                  导入角色
                </Button>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">{children}</main>

        {/* Footer */}
        <footer className="border-t">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
            AgentPlaza — 从 GitHub 导入 AI 角色，即刻聊天
          </div>
        </footer>
      </body>
    </html>
  );
}
