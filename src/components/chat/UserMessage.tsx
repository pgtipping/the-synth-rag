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
      className="ml-auto max-w-[70%] mb-2"
    >
      <div className="bg-light-accent dark:bg-dark-accent text-white rounded-[18px] rounded-br-[4px] p-4 shadow-sm">
        {text}
        <MessageReactions messageId={messageId} initialReactions={{}} />
      </div>
    </motion.div>
  );
}
