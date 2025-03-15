import { Button } from "./ui/button";
import { Icons } from "./icons";
import { useFileStore } from "@/src/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { FileIcon } from "./file-icon";
import { FileUpload } from "./file-upload";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarProps {
  useCase: string;
}

// Get file type label
const getFileTypeLabel = (fileName?: string): string => {
  const extension = fileName?.split(".").pop()?.toLowerCase() ?? "";
  switch (extension) {
    case "pdf":
      return "PDF";
    case "doc":
    case "docx":
      return "Word";
    case "xls":
    case "xlsx":
      return "Excel";
    case "csv":
      return "CSV";
    case "txt":
      return "Text";
    default:
      return "File";
  }
};

const getFileColor = (type?: string) => {
  if (!type) return "text-gray-600 dark:text-gray-400";

  if (type.includes("pdf")) return "text-red-600 dark:text-red-400";
  if (type.includes("wordprocessingml"))
    return "text-blue-600 dark:text-blue-400";
  if (type.includes("spreadsheet") || type === "text/csv")
    return "text-emerald-600 dark:text-emerald-400";
  if (type.includes("presentation"))
    return "text-orange-600 dark:text-orange-400";

  return "text-gray-600 dark:text-gray-400";
};

export function Sidebar({ useCase }: SidebarProps) {
  const { files } = useFileStore();
  const currentFiles = files[useCase] || [];
  const [isCollapsed, setIsCollapsed] = useState(false);

  const useCaseGuides = {
    onboarding: {
      title: "Onboarding Assistant",
      description:
        "Upload employee handbooks, policies, and training materials.",
      tips: [
        "Include company policies",
        "Add department-specific guides",
        "Upload training materials",
      ],
    },
    sales: {
      title: "Sales Assistant",
      description:
        "Upload product information, competitor data, and sales reports.",
      tips: [
        "Add product specifications",
        "Include pricing guides",
        "Upload market research",
      ],
    },
    knowledge: {
      title: "Knowledge Hub",
      description: "Upload documentation, guides, and knowledge base articles.",
      tips: [
        "Add technical documentation",
        "Include FAQs",
        "Upload best practices",
      ],
    },
    general: {
      title: "General Assistant",
      description:
        "Upload any documents for general assistance and information.",
      tips: [
        "Add any relevant documents",
        "Ask general questions",
        "Explore various topics",
      ],
    },
  };

  const guide =
    useCaseGuides[useCase as keyof typeof useCaseGuides] ||
    useCaseGuides.general;

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isCollapsed ? "64px" : "280px",
        transition: { duration: 0.3, ease: "easeInOut" },
      }}
      className="relative h-screen bg-light-secondary dark:bg-dark-secondary border-r border-black/10 dark:border-white/10 flex flex-col overflow-hidden"
    >
      {/* Collapse Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-2 top-2 p-1.5 h-8 w-8"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 flex flex-col h-full"
          >
            {/* Guide Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">{guide.title}</h2>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                {guide.description}
              </p>
              <div className="space-y-2">
                {guide.tips.map((tip, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Icons.check className="h-4 w-4 text-success shrink-0" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* File Upload Section */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Upload Files</h3>
              <FileUpload useCase={useCase} />
            </div>

            {/* Uploaded Files Section */}
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Uploaded Files</h3>
                <span className="text-xs text-muted-foreground">
                  {currentFiles.length}{" "}
                  {currentFiles.length === 1 ? "file" : "files"}
                </span>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-24rem)] pr-2">
                {currentFiles.length > 0 ? (
                  currentFiles.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 group border border-black/10 dark:border-white/10"
                    >
                      {/* File Icon */}
                      <div className="shrink-0">
                        <FileIcon
                          fileName={file.name}
                          className={`w-7 h-7 ${getFileColor(file.type)}`}
                        />
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium truncate text-foreground">
                            {file.name ||
                              file.preview?.split("/").pop() ||
                              `File ${file.id.slice(0, 6)}`}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {getFileTypeLabel(file.name)}
                            </span>
                            {file.status === "completed" && (
                              <span className="flex items-center gap-1 text-xs text-success">
                                <Icons.check className="h-3 w-3" />
                                Ready
                              </span>
                            )}
                            {file.status === "error" && (
                              <span className="flex items-center gap-1 text-xs text-destructive">
                                <Icons.alertTriangle className="h-3 w-3" />
                                Error
                              </span>
                            )}
                          </div>
                        </div>
                        {file.processingStage &&
                          (file.status === "uploading" ||
                            file.status === "indexing") && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                              <Icons.spinner className="h-3 w-3 animate-spin" />
                              <span className="truncate">
                                Processing: {file.processingStage}
                              </span>
                              <span className="shrink-0">
                                {file.status === "uploading"
                                  ? "Uploading..."
                                  : "Indexing..."}
                              </span>
                            </div>
                          )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Icons.upload className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      No files uploaded yet
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CTA Section */}
            <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10">
              <Button
                variant="default"
                className="w-full justify-start gap-2"
                onClick={() =>
                  window.open("https://example.com/contact", "_blank")
                }
              >
                <Icons.rocket className="h-4 w-4" />
                <span>Get Custom Solution</span>
              </Button>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2 text-center">
                Need a tailored RAG solution?
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed View */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center pt-14 px-2 gap-4"
          >
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 p-2"
              onClick={() => setIsCollapsed(false)}
              title="Upload Files"
            >
              <Icons.upload className="h-5 w-5" />
            </Button>
            {currentFiles.length > 0 && (
              <div className="flex flex-col gap-3">
                {currentFiles.slice(0, 5).map((file) => (
                  <FileIcon
                    key={file.id}
                    fileName={file.name}
                    className={`w-6 h-6 ${getFileColor(file.type)}`}
                    title={file.name}
                  />
                ))}
                {currentFiles.length > 5 && (
                  <div className="text-xs text-center text-muted-foreground">
                    +{currentFiles.length - 5}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
