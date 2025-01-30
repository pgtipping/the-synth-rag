// page.tsx
import ChatClient from "./ChatClient";

export const dynamic = "force-dynamic";

interface ChatPageProps {
  params: Promise<{ useCase: string }> | { useCase: string };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const resolvedParams = await params;
  return <ChatClient useCase={resolvedParams.useCase} />;
}
