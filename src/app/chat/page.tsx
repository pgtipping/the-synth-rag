import { redirect } from "next/navigation";

export default function ChatPage() {
  // Redirect to the default use case (onboarding)
  redirect("/chat/onboarding");
}
