/** In-chat slash commands for file operations */

interface SlashResult {
  reply: { role: "assistant"; content: string };
}

export async function handleSlashCommand(
  input: string,
  saveFile?: (fname: string, content: string) => void
): Promise<SlashResult | null> {
  const content = input.trim();

  // /read <file> or /cat <file>
  if (content.startsWith("/read ") || content.startsWith("/cat ")) {
    const fname = content.split(/\s+/).slice(1).join(" ");
    if (!fname) return null;
    const ws = localStorage.getItem("fs-workspace") || "";
    try {
      const res = await fetch(`/api/fs?workspace=${encodeURIComponent(ws)}&path=${encodeURIComponent(fname)}&read=1`);
      const data = await res.json();
      if (res.ok) {
        return { reply: { role: "assistant", content: `📄 **${fname}**\n\`\`\`\n${data.content || "(空文件)"}\n\`\`\`` } };
      }
      return { reply: { role: "assistant", content: `❌ 读取失败: ${data.error || "文件不存在"}` } };
    } catch {
      return { reply: { role: "assistant", content: "❌ 文件操作失败" } };
    }
  }

  // /write <file> <content> or /save <file> <content>
  if (content.startsWith("/write ") || content.startsWith("/save ")) {
    const parts = content.split(/\s+/).slice(1);
    if (parts.length < 2) {
      return { reply: { role: "assistant", content: "❌ 用法: /write 文件名 内容..." } };
    }
    const fname = parts[0];
    const body = parts.slice(1).join(" ");
    if (saveFile) {
      saveFile(fname, body);
      return { reply: { role: "assistant", content: `✅ 已写入 **${fname}**` } };
    }
    return { reply: { role: "assistant", content: "❌ 未设置工作目录" } };
  }

  // /ls or /dir
  if (content === "/ls" || content === "/dir") {
    const ws = localStorage.getItem("fs-workspace") || "";
    try {
      const res = await fetch(`/api/fs?workspace=${encodeURIComponent(ws)}`);
      const data = await res.json();
      if (res.ok) {
        const list = (data.files as { name: string; type: string }[])
          .map((f) => `${f.type === "dir" ? "📁" : "📄"} ${f.name}`)
          .join("\n");
        return { reply: { role: "assistant", content: `**工作目录:** ${data.workspace}\n\`\`\`\n${list || "(空目录)"}\n\`\`\`` } };
      }
      return { reply: { role: "assistant", content: `❌ ${data.error}` } };
    } catch {
      return { reply: { role: "assistant", content: "❌ 文件操作失败" } };
    }
  }

  return null; // not a slash command
}
