import { NextRequest, NextResponse } from "next/server";
import {
  getMessages,
  getSessions,
  renameSession,
  deleteSession,
} from "@/lib/agent-registry";

/** GET /api/agents/[id]/messages?sessionId=xxx — load chat history */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  try {
    if (sessionId) {
      const messages = await getMessages(id, sessionId);
      return NextResponse.json({ messages });
    }

    const sessions = await getSessions(id);
    return NextResponse.json({ sessions });
  } catch (err) {
    console.error("Failed to get messages:", err);
    return NextResponse.json({ error: "加载消息失败" }, { status: 500 });
  }
}

/** DELETE /api/agents/[id]/messages?sessionId=xxx — clear conversation */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "缺少 sessionId" }, { status: 400 });
  }

  try {
    await deleteSession(sessionId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete session:", err);
    return NextResponse.json({ error: "删除对话失败" }, { status: 500 });
  }
}

/** PATCH /api/agents/[id]/messages — rename a session */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: _agentId } = await params;

  try {
    const body = await req.json();
    const { sessionId, name } = body as { sessionId?: string; name?: string };

    if (!sessionId || !name?.trim()) {
      return NextResponse.json({ error: "缺少 sessionId 或 name" }, { status: 400 });
    }

    const session = await renameSession(sessionId, name.trim());
    return NextResponse.json({ session });
  } catch (err) {
    console.error("Failed to rename session:", err);
    return NextResponse.json({ error: "重命名失败" }, { status: 500 });
  }
}
