"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, FolderOpen, FileText, RefreshCw, FolderPlus, X } from "lucide-react";

interface FileEntry { name: string; type: "file" | "dir"; size?: number }

export function FilePanel() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState<"file" | "folder" | null>(null);

  const fetchFiles = useCallback(async (dirPath = "") => {
    try {
      const res = await fetch(`/api/fs?path=${encodeURIComponent(dirPath)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error); setFiles([]); return; }
      setFiles(data.files || []);
      setWorkspace(data.workspace || "");
      setCurrentPath(dirPath);
      setError(null);
    } catch { setError("加载失败"); }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const openFile = async (name: string) => {
    const fullPath = currentPath ? `${currentPath}/${name}` : name;
    try {
      const res = await fetch(`/api/fs?path=${encodeURIComponent(fullPath)}&read=1`);
      const data = await res.json();
      if (res.ok) { setSelectedFile(name); setFileContent(data.content || ""); }
    } catch { /* skip */ }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const fullPath = currentPath ? `${currentPath}/${newName.trim()}` : newName.trim();
    try {
      const res = await fetch("/api/fs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: fullPath, content: creating === "file" ? "" : undefined, folder: creating === "folder" }),
      });
      if (res.ok) { setNewName(""); setCreating(null); fetchFiles(currentPath); }
    } catch { /* skip */ }
  };

  const handleDelete = async (name: string) => {
    const fullPath = currentPath ? `${currentPath}/${name}` : name;
    try {
      await fetch(`/api/fs?path=${encodeURIComponent(fullPath)}`, { method: "DELETE" });
      if (selectedFile === name) { setSelectedFile(null); setFileContent(""); }
      fetchFiles(currentPath);
    } catch { /* skip */ }
  };

  const enterFolder = (name: string) => {
    const fullPath = currentPath ? `${currentPath}/${name}` : name;
    fetchFiles(fullPath);
    setSelectedFile(null);
  };

  const goUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split("/");
    parts.pop();
    fetchFiles(parts.join("/"));
    setSelectedFile(null);
  };

  if (!workspace) {
    return (
      <div className="flex flex-col h-full border-l bg-background/50">
        <div className="p-4 text-xs text-muted-foreground text-center">
          <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
          未配置工作目录
          <br />在 .env 中设置 WORKSPACE_DIR
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-l bg-background/50">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <FolderOpen className="w-3.5 h-3.5" />文件
        </span>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setCreating("file")} className="p-1 rounded hover:bg-secondary" title="新建文件"><FileText className="w-3 h-3" /></button>
          <button onClick={() => setCreating("folder")} className="p-1 rounded hover:bg-secondary" title="新建文件夹"><FolderPlus className="w-3 h-3" /></button>
          <button onClick={() => fetchFiles(currentPath)} className="p-1 rounded hover:bg-secondary" title="刷新"><RefreshCw className="w-3 h-3" /></button>
        </div>
      </div>

      {/* Create input */}
      {creating && (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b">
          <span className="text-[10px] text-muted-foreground">{creating === "file" ? "文件" : "文件夹"}：</span>
          <input
            className="flex-1 h-6 text-xs bg-background border rounded px-1.5"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(null); }}
            placeholder={creating === "file" ? "readme.md" : "src"}
            autoFocus
          />
          <button onClick={handleCreate} className="text-xs text-primary">创建</button>
          <button onClick={() => setCreating(null)}><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Breadcrumb */}
      {currentPath && (
        <div className="px-2 py-1 text-[10px] text-muted-foreground border-b flex items-center gap-1">
          <button onClick={goUp} className="hover:text-foreground">..</button>
          <span>/</span>
          <span className="truncate">{currentPath}</span>
        </div>
      )}

      {/* File list */}
      <ScrollArea className="flex-1">
        {files.length === 0 ? (
          <div className="p-4 text-xs text-muted-foreground text-center">空目录</div>
        ) : (
          files.map((f) => (
            <div
              key={f.name}
              className={`flex items-center justify-between px-3 py-1.5 text-xs cursor-pointer hover:bg-secondary/50 ${
                selectedFile === f.name ? "bg-primary/5" : ""
              }`}
              onClick={() => f.type === "dir" ? enterFolder(f.name) : openFile(f.name)}
            >
              <span className="flex items-center gap-1.5 truncate">
                {f.type === "dir" ? <FolderOpen className="w-3 h-3 text-amber-500" /> : <FileText className="w-3 h-3 text-muted-foreground" />}
                {f.name}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(f.name); }}
                className="opacity-0 hover:opacity-100 p-0.5 hover:bg-destructive/10 rounded"
              >
                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))
        )}
      </ScrollArea>

      {/* File preview */}
      {selectedFile && (
        <div className="border-t h-64">
          <div className="px-3 py-1.5 border-b text-xs font-medium text-muted-foreground flex items-center justify-between">
            {selectedFile}
            <button onClick={() => { setSelectedFile(null); setFileContent(""); }}>
              <X className="w-3 h-3" />
            </button>
          </div>
          <ScrollArea className="h-[calc(100%-32px)] p-3">
            <div className="prose prose-xs dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {fileContent || "*空文件*"}
              </ReactMarkdown>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
