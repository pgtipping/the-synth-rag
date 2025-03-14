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
import { Loader2, FileText, AlertCircle } from "lucide-react";
import { useToast } from "../../components/ui/use-toast";
import { Badge } from "../../components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { DocumentReprocessor } from "./document-reprocessor";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";

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

      // Show all documents instead of filtering
      setDocuments(normalizedData);
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
    // Only allow indexed documents to be selected
    const selectedDocuments = documents.filter(
      (doc) => selectedIds.includes(doc.id) && doc.status === "indexed"
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

  const getStatusBadge = (status: Document["status"]) => {
    switch (status) {
      case "indexed":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Indexed</Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">Processing</Badge>
        );
      case "failed":
        return <Badge className="bg-red-500 hover:bg-red-600">Failed</Badge>;
      default:
        return (
          <Badge variant="outline" className="text-gray-500">
            Uploaded
          </Badge>
        );
    }
  };

  const needsReprocessing = (doc: Document) => {
    return doc.status === "uploaded" || doc.status === "failed";
  };

  // Count documents by status
  const statusCounts = documents.reduce((acc, doc) => {
    acc[doc.status] = (acc[doc.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Check if any selected documents are not indexed
  const hasNonIndexedSelected = selectedIds.some((id) => {
    const doc = documents.find((d) => d.id === id);
    return doc && doc.status !== "indexed";
  });

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

        {/* Document Status Guide */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700 mb-4">
          <p className="font-medium mb-1">Document Status Guide:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <span className="font-medium">Indexed</span>: Document is
              processed and ready to use
            </li>
            <li>
              <span className="font-medium">Processing</span>: Document is being
              processed, please wait
            </li>
            <li>
              <span className="font-medium">Failed</span>: Processing failed,
              click "Fix Document" to retry
            </li>
            <li>
              <span className="font-medium">Uploaded</span>: Document needs
              processing, click "Process" to start
            </li>
          </ul>
          <p className="mt-2">Only indexed documents can be used for chat.</p>
        </div>

        {/* Status Summary */}
        {!loading && documents.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className="bg-green-500">
              Indexed: {statusCounts.indexed || 0}
            </Badge>
            <Badge className="bg-blue-500">
              Processing: {statusCounts.processing || 0}
            </Badge>
            <Badge className="bg-red-500">
              Failed: {statusCounts.failed || 0}
            </Badge>
            <Badge variant="outline" className="text-gray-500">
              Uploaded: {statusCounts.uploaded || 0}
            </Badge>
          </div>
        )}

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
                  className={`p-4 border rounded-lg transition-colors ${
                    selectedIds.includes(doc.id)
                      ? "border-primary bg-primary/5"
                      : "hover:bg-gray-50"
                  } ${doc.status !== "indexed" ? "opacity-80" : ""}`}
                  onClick={() =>
                    doc.status === "indexed"
                      ? toggleDocumentSelection(doc.id)
                      : null
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{doc.originalName}</div>
                      <div className="text-sm text-gray-500">
                        {formatFileSize(doc.sizeBytes)} • Uploaded{" "}
                        {formatDate(doc.createdAt)}
                      </div>
                      {doc.errorMessage && (
                        <div className="text-sm text-red-500 mt-1">
                          Error: {doc.errorMessage}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(doc.status)}
                      {doc.status === "indexed" && (
                        <Badge
                          variant={
                            selectedIds.includes(doc.id) ? "default" : "outline"
                          }
                        >
                          {selectedIds.includes(doc.id) ? "Selected" : "Select"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Only show reprocessor for documents that need it */}
                  {needsReprocessing(doc) && (
                    <div
                      className="mt-2 flex justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DocumentReprocessor
                        documentId={doc.id}
                        onSuccess={() => fetchDocuments()}
                        errorMessage={doc.errorMessage}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Warning for non-indexed selected documents */}
            {hasNonIndexedSelected && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  You've selected documents that aren't properly processed. Only
                  indexed documents can be used for chat.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={
                  selectedIds.length === 0 ||
                  !selectedIds.some(
                    (id) =>
                      documents.find((doc) => doc.id === id)?.status ===
                      "indexed"
                  )
                }
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
