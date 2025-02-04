import { motion, AnimatePresence } from "framer-motion";
import { FileIcon } from "../file-icon";
import { Icons } from "../icons";
import { FileWithId } from "@/src/types/file";

interface FilePreviewProps {
  file: FileWithId;
  onRemove: (file: FileWithId) => void;
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "completed":
        return "text-light-success dark:text-dark-success";
      case "error":
        return "text-light-destructive dark:text-dark-destructive";
      default:
        return "text-light-text-secondary dark:text-dark-text-secondary";
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case "completed":
        return <Icons.check className="h-4 w-4" />;
      case "error":
        return <Icons.alertTriangle className="h-4 w-4" />;
      case "uploading":
      case "indexing":
        return <Icons.spinner className="h-4 w-4 animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: file.status === "error" ? [1, 1.02, 1] : 1,
        x: file.status === "error" ? [-4, 4, -4, 4, 0] : 0,
      }}
      transition={{
        scale: {
          duration: 0.2,
          repeat: file.status === "error" ? 1 : 0,
        },
        x: {
          duration: 0.4,
          repeat: file.status === "error" ? 1 : 0,
        },
      }}
      exit={{ opacity: 0, y: -20 }}
      className={`group relative rounded-[18px] p-4 shadow-sm hover:shadow-md transition-shadow duration-300 ${
        file.status === "error"
          ? "bg-light-destructive/5 dark:bg-dark-destructive/10 border border-light-destructive/20 dark:border-dark-destructive/20"
          : "bg-light-secondary dark:bg-dark-secondary"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* File Icon */}
        <div className="shrink-0">
          <FileIcon fileName={file.name || ""} className="w-8 h-8" />
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-light-text-primary dark:text-dark-text-primary font-medium truncate">
              {file.name || "Untitled"}
            </h3>
            <span
              className={`flex items-center ${getStatusColor(file.status)}`}
            >
              {getStatusIcon(file.status)}
            </span>
          </div>

          {/* File Size */}
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>

          {/* Progress Bar */}
          {file.processingStage &&
            (file.status === "uploading" || file.status === "indexing") && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">
                  <span>{file.processingStage.message || file.status}</span>
                  <span>{Math.round(file.processingStage.progress)}%</span>
                </div>
                <div className="h-1 bg-light-text-secondary/10 dark:bg-dark-text-secondary/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-light-accent dark:bg-dark-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${file.processingStage.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

          {/* Error Message */}
          <AnimatePresence>
            {file.status === "error" && file.error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-light-destructive dark:text-dark-destructive mt-1"
              >
                {file.error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Remove Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onRemove(file)}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-light-text-secondary/10 dark:hover:bg-dark-text-secondary/10"
          aria-label="Remove file"
        >
          <Icons.trash className="h-4 w-4 text-light-text-secondary dark:text-dark-text-secondary" />
        </motion.button>
      </div>
    </motion.div>
  );
}
