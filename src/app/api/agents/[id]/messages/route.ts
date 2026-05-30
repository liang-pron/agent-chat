import { NextRequest, NextResponse } from "next/server";
import { getMessages, deleteMessages, getSessions } from "@/lib/agent-registry";

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
      // Load messages for a specific session
      const messages = await getMessages(id, sessionId);
      return NextResponse.json({ messages });
    }

    // No sessionId → list all sessions for this agent
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
    await deleteMessages(id, sessionId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete messages:", err);
    return NextResponse.json({ error: "删除消息失败" }, { status: 500 });
  }
}
