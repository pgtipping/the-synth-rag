import { motion } from "framer-motion";
import { MessageReactions } from "./MessageReactions";

export function BotMessage({
  text,
  messageId,
}: {
  text: string;
  messageId: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="max-w-[70%] mb-2"
    >
      <div className="bg-light-secondary dark:bg-dark-secondary text-light-text-primary dark:text-dark-text-primary rounded-[18px] rounded-bl-[4px] p-4 shadow-sm">
        {text}
        <MessageReactions messageId={messageId} initialReactions={{}} />
      </div>
    </motion.div>
  );
}
