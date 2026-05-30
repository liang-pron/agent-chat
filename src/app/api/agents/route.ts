import { NextRequest, NextResponse } from "next/server";
import { listAgents, registerAgent } from "@/lib/agent-registry";

/** GET /api/agents — list all agents, optionally filtered by category */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;

  try {
    const agents = await listAgents(category);
    return NextResponse.json({ agents });
  } catch (err) {
    console.error("Failed to list agents:", err);
    return NextResponse.json({ error: "加载角色列表失败" }, { status: 500 });
  }
}

/** POST /api/agents — manually create an agent (alternative to import) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, category, githubUrl, systemPrompt, modelConfig, avatarUrl } = body;

    if (!name || !systemPrompt || !githubUrl) {
      return NextResponse.json({ error: "缺少必填字段：name, systemPrompt, githubUrl" }, { status: 400 });
    }

    const agent = await registerAgent({
      name,
      description: description || "",
      category: category || "其他",
      githubUrl,
      systemPrompt,
      modelConfig: typeof modelConfig === "string" ? modelConfig : JSON.stringify(modelConfig || {}),
      avatarUrl,
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (err) {
    console.error("Failed to create agent:", err);
    return NextResponse.json({ error: "创建角色失败" }, { status: 500 });
  }
}
