"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, FolderOpen, FileText, RefreshCw, FolderPlus, X, FolderInput } from "lucide-react";

interface FileEntry { name: string; type: "file" | "dir"; size?: number }

export function FilePanel() {
  const [workspace, setWorkspace] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("fs-workspace") || "";
  });
  const [pathInput, setPathInput] = useState(workspace);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState<"file" | "folder" | null>(null);

  const apiHeaders = (): Record<string, string> => (workspace ? { "x-workspace": workspace } : {});

  const fetchFiles = useCallback(async (dirPath = "") => {
    if (!workspace) return;
    try {
      const res = await fetch(`/api/fs?workspace=${encodeURIComponent(workspace)}&path=${encodeURIComponent(dirPath)}`, { headers: apiHeaders() });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setFiles([]); return; }
      setFiles(data.files || []);
      setCurrentPath(dirPath);
      setError(null);
    } catch { setError("加载失败"); }
  }, [workspace]);

  useEffect(() => { if (workspace) { fetchFiles(); } else { setError(null); } }, [fetchFiles, workspace]);

  const openWorkspace = () => {
    const dir = pathInput.trim();
    if (!dir) return;
    setWorkspace(dir);
    localStorage.setItem("fs-workspace", dir);
    setCurrentPath("");
    setSelectedFile(null);
  };

  const openFile = async (name: string) => {
    const fullPath = currentPath ? `${currentPath}/${name}` : name;
    try {
      const res = await fetch(`/api/fs?workspace=${encodeURIComponent(workspace)}&path=${encodeURIComponent(fullPath)}&read=1`);
      const data = await res.json();
      if (res.ok) { setSelectedFile(name); setFileContent(data.content || ""); }
    } catch { /* skip */ }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const fullPath = currentPath ? `${currentPath}/${newName.trim()}` : newName.trim();
    const action = creating === "folder" ? `创建文件夹: ${newName}` : `创建文件: ${newName}`;
    if (!confirm(`${action}\n位置: ${workspace}/${fullPath}`)) return;

    try {
      const res = await fetch(`/api/fs?workspace=${encodeURIComponent(workspace)}`, {
        method: "POST",
        headers: { ...apiHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ path: fullPath, content: creating === "file" ? "" : undefined, folder: creating === "folder" }),
      });
      if (res.ok) { setNewName(""); setCreating(null); fetchFiles(currentPath); }
    } catch { /* skip */ }
  };

  const handleDelete = async (name: string) => {
    const fullPath = currentPath ? `${currentPath}/${name}` : name;
    if (!confirm(`确定删除: ${workspace}/${fullPath}？`)) return;

    try {
      await fetch(`/api/fs?workspace=${encodeURIComponent(workspace)}&path=${encodeURIComponent(fullPath)}`, { method: "DELETE" });
      if (selectedFile === name) { setSelectedFile(null); setFileContent(""); }
      fetchFiles(currentPath);
    } catch { /* skip */ }
  };

  const saveFile = async (fname: string, content: string) => {
    if (!confirm(`写入文件: ${workspace}/${fname}？`)) return;
    try {
      const res = await fetch(`/api/fs?workspace=${encodeURIComponent(workspace)}`, {
        method: "POST",
        headers: { ...apiHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ path: fname, content }),
      });
      if (res.ok) { fetchFiles(currentPath); alert("已保存: " + fname); }
      else alert("保存失败");
    } catch { alert("保存失败"); }
  };

  // Expose saveFile globally so ChatInterface can call it
  if (typeof window !== "undefined") (window as unknown as Record<string, unknown>).__fsSave = saveFile;

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

  // Directory setup screen
  if (!workspace) {
    return (
      <div className="flex flex-col h-full border-l bg-background/50">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <FolderInput className="w-4 h-4" />打开工作目录
          </div>
          <input
            className="w-full h-8 rounded-lg border px-2.5 text-xs bg-background"
            placeholder="C:\Users\Lenovo\projects"
            value={pathInput}
            onChange={(e) => setPathInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && openWorkspace()}
          />
          <Button onClick={openWorkspace} size="sm" className="w-full text-xs">打开目录</Button>
          <p className="text-[10px] text-muted-foreground">选择本地文件夹，智能体可在其中读写文件。<br />每次操作都会提示确认。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-l bg-background/50">
      {/* Header — workspace indicator */}
      <div className="px-2 py-1.5 border-b text-[10px] text-muted-foreground truncate flex items-center gap-1">
        <FolderOpen className="w-3 h-3 shrink-0" />
        <span className="truncate">{workspace.split("/").pop() || workspace.split("\\").pop()}</span>
        <button onClick={() => { setWorkspace(""); localStorage.removeItem("fs-workspace"); }} className="ml-auto shrink-0 hover:text-foreground"><X className="w-3 h-3" /></button>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b">
        <span className="text-[10px] text-muted-foreground">文件</span>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setCreating("file")} className="p-1 rounded hover:bg-secondary" title="新建文件"><FileText className="w-3 h-3" /></button>
          <button onClick={() => setCreating("folder")} className="p-1 rounded hover:bg-secondary" title="新建文件夹"><FolderPlus className="w-3 h-3" /></button>
          <button onClick={() => fetchFiles(currentPath)} className="p-1 rounded hover:bg-secondary" title="刷新"><RefreshCw className="w-3 h-3" /></button>
        </div>
      </div>

      {/* Create input */}
      {creating && (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b">
          <span className="text-[10px] text-muted-foreground shrink-0">{creating === "file" ? "文件" : "文件夹"}：</span>
          <input className="flex-1 h-6 text-xs bg-background border rounded px-1.5" value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(null); }}
            placeholder={creating === "file" ? "readme.md" : "src"} autoFocus />
          <button onClick={handleCreate} className="text-xs text-primary shrink-0">创建</button>
          <button onClick={() => setCreating(null)}><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Breadcrumb */}
      {currentPath && (
        <div className="px-2 py-1 text-[10px] text-muted-foreground border-b flex items-center gap-1">
          <button onClick={goUp} className="hover:text-foreground">..</button><span>/</span>
          <span className="truncate">{currentPath}</span>
        </div>
      )}

      {/* File list */}
      <ScrollArea className="flex-1">
        {error ? (
          <div className="p-3 text-xs text-destructive">{error}</div>
        ) : files.length === 0 ? (
          <div className="p-4 text-xs text-muted-foreground text-center">空目录</div>
        ) : (
          files.map((f) => (
            <div key={f.name} className={`flex items-center justify-between px-2 py-1.5 text-xs cursor-pointer hover:bg-secondary/50 ${selectedFile === f.name ? "bg-primary/5" : ""}`}
              onClick={() => f.type === "dir" ? enterFolder(f.name) : openFile(f.name)}>
              <span className="flex items-center gap-1.5 truncate">
                {f.type === "dir" ? <FolderOpen className="w-3 h-3 text-amber-500 shrink-0" /> : <FileText className="w-3 h-3 text-muted-foreground shrink-0" />}
                {f.name}
              </span>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(f.name); }}
                className="opacity-0 hover:opacity-100 p-0.5 hover:bg-destructive/10 rounded shrink-0">
                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))
        )}
      </ScrollArea>

      {/* File preview */}
      {selectedFile && (
        <div className="border-t h-48">
          <div className="px-3 py-1.5 border-b text-xs font-medium text-muted-foreground flex items-center justify-between">
            {selectedFile}
            <button onClick={() => { setSelectedFile(null); setFileContent(""); }}><X className="w-3 h-3" /></button>
          </div>
          <ScrollArea className="h-[calc(100%-28px)] p-2">
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
