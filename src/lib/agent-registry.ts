import { prisma } from "@/lib/prisma";
import type { Agent } from "@/generated/prisma/client";

export type AgentWithCount = Agent & { _count: { messages: number } };

/** List all agents, optionally filtered by category */
export async function listAgents(category?: string): Promise<AgentWithCount[]> {
  return prisma.agent.findMany({
    where: category && category !== "全部" ? { category } : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });
}

/** Get a single agent by ID */
export async function getAgent(id: string): Promise<Agent | null> {
  return prisma.agent.findUnique({ where: { id } });
}

/** Register a new agent in the plaza */
export async function registerAgent(data: {
  name: string;
  description: string;
  category: string;
  githubUrl: string;
  systemPrompt: string;
  modelConfig: string;
  avatarUrl?: string;
}): Promise<Agent> {
  return prisma.agent.create({ data });
}

/** Check if a GitHub repo has already been imported */
export async function isRepoImported(githubUrl: string): Promise<boolean> {
  const existing = await prisma.agent.findFirst({ where: { githubUrl } });
  return existing !== null;
}

/** Get all unique categories in use */
export async function getCategories(): Promise<string[]> {
  const result = await prisma.agent.findMany({
    select: { category: true },
    distinct: ["category"],
  });
  return result.map((r: { category: string }) => r.category);
}

/** Update an agent's name, avatar, and/or category */
export async function updateAgent(
  id: string,
  data: { name?: string; avatarUrl?: string | null; category?: string }
): Promise<Agent> {
  return prisma.agent.update({ where: { id }, data });
}

/** Delete an agent and all its chat messages */
export async function deleteAgent(id: string): Promise<void> {
  await prisma.agent.delete({ where: { id } });
}

/** Get messages for a specific agent + session */
export async function getMessages(agentId: string, sessionId: string) {
  return prisma.chatMessage.findMany({
    where: { agentId, sessionId },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true },
  });
}

/** Delete all messages for a specific session */
export async function deleteMessages(agentId: string, sessionId: string) {
  await prisma.chatMessage.deleteMany({
    where: { agentId, sessionId },
  });
}

/** Get all sessions with message counts for an agent (for conversation list) */
export async function getSessions(agentId: string) {
  return prisma.session.findMany({
    where: { agentId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { messages: true } },
      messages: { take: 1, orderBy: { createdAt: "desc" }, select: { content: true } },
    },
  });
}

/** Get or create a session for an agent */
export async function ensureSession(agentId: string, sessionId: string) {
  let session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) {
    session = await prisma.session.create({
      data: { id: sessionId, agentId, name: "新的对话" },
    });
  }
  return session;
}

/** Rename a session */
export async function renameSession(sessionId: string, name: string) {
  return prisma.session.update({
    where: { id: sessionId },
    data: { name, updatedAt: new Date() },
  });
}

/** Delete a session and its messages */
export async function deleteSession(sessionId: string) {
  await prisma.session.delete({ where: { id: sessionId } });
}
