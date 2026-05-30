import { NextRequest, NextResponse } from "next/server";
import { getAgent, updateAgent, deleteAgent } from "@/lib/agent-registry";

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

/** PATCH /api/agents/[id] — update agent name and/or avatar */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { name, avatarUrl, category } = body as {
      name?: string;
      avatarUrl?: string | null;
      category?: string;
    };

    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: "角色名不能为空" }, { status: 400 });
    }

    const agent = await updateAgent(id, {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      ...(category !== undefined ? { category } : {}),
    });

    return NextResponse.json({ agent });
  } catch (err) {
    console.error("Failed to update agent:", err);
    return NextResponse.json({ error: "更新角色失败" }, { status: 500 });
  }
}

/** DELETE /api/agents/[id] — delete an agent */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const agent = await getAgent(id);
    if (!agent) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 });
    }
    await deleteAgent(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete agent:", err);
    return NextResponse.json({ error: "删除角色失败" }, { status: 500 });
  }
}
