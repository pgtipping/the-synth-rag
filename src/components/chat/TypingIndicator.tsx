import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-[80%] bg-gray-100 rounded-lg p-3 mb-2"
    >
      <div className="flex space-x-1 px-2 py-1">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-gray-500 rounded-full"
            animate={{
              y: ["0%", "-50%", "0%"],
              scale: [1, 1.2, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 0.6,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
