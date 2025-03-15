"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "../../components/ui/use-toast";
import { DocumentHealthCheck } from "./document-health-check";

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
  metadata?: {
    useCase?: string;
    [key: string]: string | number | boolean | null | undefined;
  };
}

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

interface HealthCheckResult {
  documentId: number;
  documentName: string;
  status: "healthy" | "unhealthy";
  issues: string[];
  details: {
    totalChunks: number;
    chunksWithVectors: number;
    chunksWithoutVectors: number;
    vectorsInPinecone: number;
    missingVectors: string[];
  };
}

const USE_CASES = [
  { value: "general", label: "General" },
  { value: "sales_assistant", label: "Sales Assistant" },
  { value: "onboarding_assistant", label: "Onboarding Assistant" },
  { value: "knowledge_hub", label: "Knowledge Hub" },
];

export function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUseCase, setSelectedUseCase] = useState<string>("all");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [updatingUseCase, setUpdatingUseCase] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const url =
        selectedUseCase === "all"
          ? "/api/documents"
          : `/api/documents?useCase=${selectedUseCase}`;
      const response = await fetch(url);

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

      console.log("Normalized data:", normalizedData);
      setDocuments(normalizedData);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      });
      // Set documents to empty array to avoid showing loading spinner indefinitely
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedUseCase, toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle document health check results
  const handleHealthCheck = (result: HealthCheckResult) => {
    // If the document status has changed, refresh the document list
    const document = documents.find((doc) => doc.id === result.documentId);
    if (document) {
      const isStatusChanged =
        (result.status === "healthy" && document.status !== "indexed") ||
        (result.status === "unhealthy" && document.status === "indexed");

      if (isStatusChanged) {
        fetchDocuments();
      }
    }
  };

  const deleteDocument = async (id: number) => {
    try {
      setDeleting(id);
      const response = await fetch(`/api/documents?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete document");

      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const updateDocumentUseCase = async (id: number, newUseCase: string) => {
    try {
      setUpdatingUseCase(id);
      const response = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ useCase: newUseCase }),
      });

      if (!response.ok) throw new Error("Failed to update document use case");

      // Update the document in the local state
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === id ? { ...doc, useCase: newUseCase } : doc
        )
      );

      toast({
        title: "Success",
        description: "Document use case updated successfully",
      });
    } catch (error) {
      console.error("Error updating document use case:", error);
      toast({
        title: "Error",
        description: "Failed to update document use case",
        variant: "destructive",
      });
    } finally {
      setUpdatingUseCase(null);
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

  const formatDate = (dateString: string | Date | undefined | null) => {
    if (!dateString) {
      return "Unknown date";
    }

    try {
      // If dateString is already a Date object
      const date =
        dateString instanceof Date ? dateString : new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        // Try parsing ISO string if it's in a different format
        if (typeof dateString === "string") {
          // Try to handle PostgreSQL timestamp format
          if (dateString.includes("T") || dateString.includes(" ")) {
            const parsed = Date.parse(dateString);
            if (!isNaN(parsed)) {
              return formatDistanceToNow(new Date(parsed), { addSuffix: true });
            }
          }
        }
        console.warn("Invalid date:", dateString);
        return "Invalid date";
      }

      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error("Error parsing date:", error, "Value:", dateString);
      return "Invalid date";
    }
  };

  const getStatusBadge = (status: Document["status"]) => {
    switch (status) {
      case "indexed":
        return (
          <Badge className="bg-green-100 text-green-800 border border-green-300 hover:bg-green-200">
            Indexed
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200">
            Processing
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 border border-red-300 hover:bg-red-200">
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200">
            Uploaded
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
          Documents
        </h2>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Select value={selectedUseCase} onValueChange={setSelectedUseCase}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by use case" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Use Cases</SelectItem>
              {USE_CASES.map((useCase) => (
                <SelectItem key={useCase.value} value={useCase.value}>
                  {useCase.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDocuments()}
            disabled={loading}
            className="whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Refresh"
            )}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No documents found. Upload a document to get started.
        </div>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Name</TableHead>
                <TableHead className="min-w-[80px] hidden sm:table-cell">
                  Size
                </TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="min-w-[140px] hidden lg:table-cell">
                  Use Case
                </TableHead>
                <TableHead className="min-w-[120px] hidden md:table-cell">
                  Uploaded
                </TableHead>
                <TableHead className="text-right min-w-[120px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell className="font-medium">
                    {document.originalName}
                    {document.status === "failed" && document.errorMessage && (
                      <div className="text-xs text-red-500 mt-1">
                        Error: {document.errorMessage}
                      </div>
                    )}
                    <div className="md:hidden text-xs text-muted-foreground mt-1">
                      {formatFileSize(document.sizeBytes)}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {formatFileSize(document.sizeBytes)}
                  </TableCell>
                  <TableCell>{getStatusBadge(document.status)}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {updatingUseCase === document.id ? (
                      <Select
                        defaultValue={document.useCase}
                        onValueChange={(value) =>
                          updateDocumentUseCase(document.id, value)
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {USE_CASES.map((useCase) => (
                            <SelectItem
                              key={useCase.value}
                              value={useCase.value}
                            >
                              {useCase.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => setUpdatingUseCase(document.id)}
                      >
                        {USE_CASES.find((uc) => uc.value === document.useCase)
                          ?.label || document.useCase}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(document.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1 sm:space-x-2">
                      <DocumentHealthCheck
                        documentId={document.id}
                        onHealthCheck={handleHealthCheck}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDocument(document.id)}
                        disabled={deleting === document.id}
                        className="text-xs"
                      >
                        {deleting === document.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
