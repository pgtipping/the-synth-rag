import { motion } from "framer-motion";
import { MessageReactions } from "./MessageReactions";

export function UserMessage({
  text,
  messageId,
}: {
  text: string;
  messageId: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="ml-auto max-w-[80%] mb-2"
    >
      <div className="bg-blue-500 text-white rounded-lg p-3">
        {text}
        <MessageReactions messageId={messageId} initialReactions={{}} />
      </div>
    </motion.div>
  );
}
