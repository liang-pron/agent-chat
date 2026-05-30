import { NextRequest, NextResponse } from "next/server";
import { getAgent } from "@/lib/agent-registry";

/** GET /api/agents/[id] — get a single agent */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const agent = await getAgent(id);
    if (!agent) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 });
    }
    return NextResponse.json({ agent });
  } catch (err) {
    console.error("Failed to get agent:", err);
    return NextResponse.json({ error: "加载角色失败" }, { status: 500 });
  }
}
