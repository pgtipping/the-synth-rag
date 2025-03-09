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

interface ApiDocument {
  id: number;
  original_name?: string;
  originalName?: string;
  content_type?: string;
  contentType?: string;
  size_bytes?: number;
  sizeBytes?: number;
  status: "uploaded" | "processing" | "indexed" | "failed";
  created_at?: string | Date;
  createdAt?: string | Date;
  useCase?: string;
  error_message?: string | null;
  errorMessage?: string | null;
  metadata?: {
    useCase?: string;
    [key: string]: string | number | boolean | null | undefined;
  };
}

interface Document {
  id: number;
  original_name?: string;
  originalName?: string;
  content_type?: string;
  contentType?: string;
  size_bytes?: number;
  sizeBytes?: number;
  status: "uploaded" | "processing" | "indexed" | "failed";
  created_at?: string | Date;
  createdAt?: string | Date;
  useCase?: string;
  error_message?: string | null;
  errorMessage?: string | null;
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
  const { toast } = useToast();

  const fetchDocuments = useCallback(async () => {
    try {
      const url =
        selectedUseCase === "all"
          ? "/api/documents"
          : `/api/documents?useCase=${selectedUseCase}`;
      const response = await fetch(url);
      const data = await response.json();

      // Normalize data to ensure consistent property names
      const normalizedData = data.map((doc: ApiDocument) => ({
        id: doc.id,
        originalName: doc.originalName || doc.original_name,
        contentType: doc.contentType || doc.content_type,
        sizeBytes: doc.sizeBytes || doc.size_bytes,
        status: doc.status,
        createdAt: doc.createdAt || doc.created_at,
        useCase:
          doc.useCase || (doc.metadata && doc.metadata.useCase) || "general",
        errorMessage: doc.errorMessage || doc.error_message,
      }));

      setDocuments(normalizedData);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedUseCase, toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

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

  const formatFileSize = (bytes: number | undefined | null) => {
    if (bytes === undefined || bytes === null || isNaN(bytes)) {
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

  const getStatusColor = (status: Document["status"]) => {
    switch (status) {
      case "indexed":
        return "bg-green-500";
      case "processing":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-blue-500";
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold tracking-tight">Documents</h2>
        <Select value={selectedUseCase} onValueChange={setSelectedUseCase}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select use case" />
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
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No documents found
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Use Case</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    {doc.originalName || doc.original_name || "Unknown"}
                  </TableCell>
                  <TableCell>
                    {doc.contentType || doc.content_type || "Unknown"}
                  </TableCell>
                  <TableCell>
                    {USE_CASES.find((uc) => uc.value === doc.useCase)?.label ||
                      doc.useCase ||
                      "General"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${getStatusColor(doc.status)} text-white`}
                    >
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatFileSize(doc.sizeBytes || doc.size_bytes)}
                  </TableCell>
                  <TableCell>
                    {formatDate(doc.createdAt || doc.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteDocument(doc.id)}
                      disabled={deleting === doc.id}
                    >
                      {deleting === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
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
