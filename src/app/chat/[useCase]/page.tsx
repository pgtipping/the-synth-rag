// page.tsx
import ChatClient from "./ChatClient";

export const dynamic = "force-dynamic";

export default function ChatPage({ params }: { params: { useCase: string } }) {
  // This just renders the chat interface
  return <ChatClient useCase={params.useCase} />;
}
