import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Loader2, FileText } from "lucide-react";
import { useToast } from "../../components/ui/use-toast";
import { Badge } from "../../components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { DocumentReprocessor } from "./document-reprocessor";

interface Document {
  id: number;
  originalName: string;
  contentType: string;
  sizeBytes: number | string;
  status: "uploaded" | "processing" | "indexed" | "failed";
  createdAt: string | Date;
  useCase: string;
  errorMessage: string | null;
}

interface ApiDocument {
  id: number;
  original_name?: string;
  originalName?: string;
  content_type?: string;
  contentType?: string;
  size_bytes?: number | string;
  sizeBytes?: number | string;
  status: "uploaded" | "processing" | "indexed" | "failed";
  created_at?: string | Date;
  createdAt?: string | Date;
  useCase?: string;
  use_case?: string;
  error_message?: string | null;
  errorMessage?: string | null;
}

interface DocumentSelectorProps {
  useCase: string;
  onDocumentsSelected: (documents: Document[]) => void;
  selectedDocumentIds?: number[];
}

export function DocumentSelector({
  useCase,
  onDocumentsSelected,
  selectedDocumentIds = [],
}: DocumentSelectorProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>(selectedDocumentIds);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents?useCase=${useCase}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Normalize data to ensure consistent property names
      const normalizedData = data.map((doc: ApiDocument) => ({
        id: doc.id,
        originalName: doc.originalName || doc.original_name || "Unknown",
        contentType: doc.contentType || doc.content_type || "Unknown",
        sizeBytes: doc.sizeBytes || doc.size_bytes || 0,
        status: doc.status || "uploaded",
        createdAt: doc.createdAt || doc.created_at || new Date(),
        useCase: doc.useCase || doc.use_case || "general",
        errorMessage: doc.errorMessage || doc.error_message || null,
      }));

      // Filter out documents that are not indexed
      const indexedDocuments = normalizedData.filter(
        (doc: Document) => doc.status === "indexed"
      );

      setDocuments(indexedDocuments);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      });
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [useCase, toast]);

  useEffect(() => {
    // Only fetch documents when the dialog is open
    if (open) {
      fetchDocuments();
    }

    // Reset selected IDs when the component receives new selectedDocumentIds
    if (
      selectedDocumentIds.length > 0 &&
      JSON.stringify(selectedIds) !== JSON.stringify(selectedDocumentIds)
    ) {
      setSelectedIds(selectedDocumentIds);
    }
  }, [fetchDocuments, open, selectedDocumentIds, selectedIds]);

  const toggleDocumentSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const selectedDocuments = documents.filter((doc) =>
      selectedIds.includes(doc.id)
    );
    onDocumentsSelected(selectedDocuments);
    setOpen(false);
  };

  const formatDate = (dateString: string | Date) => {
    try {
      const date =
        dateString instanceof Date ? dateString : new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "Unknown date";
    }
  };

  const formatFileSize = (bytes: number | string | undefined | null) => {
    if (bytes === undefined || bytes === null || isNaN(Number(bytes))) {
      return "0 B";
    }

    const units = ["B", "KB", "MB", "GB"];
    let size = Number(bytes);
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Select Documents
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Documents</DialogTitle>
          <DialogDescription>
            Choose documents to use in this chat session
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No documents found for this use case
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedIds.includes(doc.id)
                      ? "border-primary bg-primary/5"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => toggleDocumentSelection(doc.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{doc.originalName}</div>
                      <div className="text-sm text-gray-500">
                        {formatFileSize(doc.sizeBytes)} • Uploaded{" "}
                        {formatDate(doc.createdAt)}
                      </div>
                    </div>
                    <Badge
                      variant={
                        selectedIds.includes(doc.id) ? "default" : "outline"
                      }
                    >
                      {selectedIds.includes(doc.id) ? "Selected" : "Select"}
                    </Badge>
                  </div>

                  <div
                    className="mt-2 flex justify-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DocumentReprocessor
                      documentId={doc.id}
                      onSuccess={() => fetchDocuments()}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedIds.length === 0}
              >
                Use Selected Documents
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
