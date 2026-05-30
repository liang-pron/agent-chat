import { NextRequest } from "next/server";
import { streamText, type ModelMessage } from "ai";
import { getAgent, ensureSession } from "@/lib/agent-registry";
import { routeModel } from "@/lib/model-router";
import { validateMessage } from "@/lib/validators";
import { prisma } from "@/lib/prisma";

/** POST /api/agents/[id]/chat — send a message to an agent (streaming text response) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { messages, sessionId, apiKey } = body as {
      messages: { role: string; content: string }[];
      sessionId?: string;
      apiKey?: string;
    };

    // Validate the last (user) message
    const lastMessage = messages?.[messages.length - 1];
    if (lastMessage?.role === "user") {
      const validation = validateMessage(lastMessage.content);
      if (validation.error) {
        return new Response(validation.error, { status: 400 });
      }
    }

    // Get agent
    const agent = await getAgent(id);
    if (!agent) {
      return new Response("角色不存在", { status: 404 });
    }

    // Ensure session exists (creates one if first message)
    if (sessionId) {
      await ensureSession(id, sessionId).catch(() => {});
    }

    // Route to model (user's API key takes priority over server key)
    const { model } = routeModel(agent.modelConfig, apiKey);
    const systemMessage = agent.systemPrompt;

    // Save user message to DB (if sessionId provided)
    if (sessionId && lastMessage?.role === "user") {
      await prisma.chatMessage.create({
        data: {
          agentId: id,
          sessionId,
          role: "user",
          content: lastMessage.content,
        },
      }).catch(() => {
        // Non-critical: don't fail the chat if DB write fails
      });
    }

    // Convert messages to AI SDK format (directly cast — our format matches ModelMessage)
    const modelMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })) as ModelMessage[];

    // Stream response — large context window
    const result = streamText({
      model,
      system: systemMessage,
      messages: modelMessages,
      maxOutputTokens: 32768,
      onFinish: async ({ text }) => {
        if (sessionId && text) {
          await prisma.chatMessage.create({
            data: {
              agentId: id,
              sessionId,
              role: "assistant",
              content: text,
            },
          }).catch(() => {
            // Non-critical
          });
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error("Chat error:", err);
    return new Response("聊天服务出错，请稍后重试", { status: 500 });
  }
}
