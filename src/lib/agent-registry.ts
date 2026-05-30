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

/** Update an agent's name and/or avatar */
export async function updateAgent(
  id: string,
  data: { name?: string; avatarUrl?: string | null }
): Promise<Agent> {
  return prisma.agent.update({ where: { id }, data });
}

/** Delete an agent and all its chat messages */
export async function deleteAgent(id: string): Promise<void> {
  await prisma.agent.delete({ where: { id } });
}
