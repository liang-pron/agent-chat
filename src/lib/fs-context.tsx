"use client";

import { createContext, useContext } from "react";

interface FileSystemContextValue {
  saveFile: (fname: string, content: string) => void;
  workspace: string;
}

export const FileSystemContext = createContext<FileSystemContextValue>({
  saveFile: async (fname, content) => {
    const ws = localStorage.getItem("fs-workspace") || "";
    await fetch(`/api/fs?workspace=${encodeURIComponent(ws)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: fname, content }),
    });
  },
  workspace: "",
});

export function useFileSystem() {
  return useContext(FileSystemContext);
}
