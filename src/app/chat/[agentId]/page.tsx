import { notFound } from "next/navigation";
import Link from "next/link";
import { getAgent } from "@/lib/agent-registry";
import { ChatInterface } from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ChatPageProps {
  params: Promise<{ agentId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { agentId } = await params;
  const agent = await getAgent(agentId);

  if (!agent) {
    notFound();
  }

  return (
    <div className="space-y-0">
      {/* Back button */}
      <div className="px-4 py-2">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            返回广场
          </Button>
        </Link>
      </div>

      {/* Chat interface */}
      <ChatInterface
        agentId={agent.id}
        agentName={agent.name}
        agentAvatar={agent.avatarUrl}
      />
    </div>
  );
}
