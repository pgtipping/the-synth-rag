"use client";

import { motion } from "framer-motion";
import { Icons } from "../icons";

export function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-center gap-2 p-4"
    >
      <Icons.spinner className="h-4 w-4 animate-spin" />
      <span className="text-sm text-muted-foreground">Thinking...</span>
    </motion.div>
  );
}
