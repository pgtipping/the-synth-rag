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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold tracking-tight">Documents</h2>
        <Select value={selectedUseCase} onValueChange={setSelectedUseCase}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select use case" />
          </SelectTrigger>
          <SelectContent className="bg-white border shadow-md">
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
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[25%]">Name</TableHead>
                <TableHead className="w-[20%]">Use Case</TableHead>
                <TableHead className="w-[15%]">Status</TableHead>
                <TableHead className="w-[10%]">Size</TableHead>
                <TableHead className="w-[15%]">Uploaded</TableHead>
                <TableHead className="w-[15%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {doc.originalName}
                  </TableCell>
                  <TableCell>
                    {updatingUseCase === doc.id ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Updating...</span>
                      </div>
                    ) : (
                      <Select
                        value={doc.useCase}
                        onValueChange={(value) =>
                          updateDocumentUseCase(doc.id, value)
                        }
                        disabled={doc.status !== "indexed"}
                      >
                        <SelectTrigger className="w-full h-8 text-sm">
                          <SelectValue>
                            {USE_CASES.find((uc) => uc.value === doc.useCase)
                              ?.label ||
                              doc.useCase ||
                              "General"}
                          </SelectValue>
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
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell>{formatFileSize(doc.sizeBytes)}</TableCell>
                  <TableCell>{formatDate(doc.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteDocument(doc.id)}
                        disabled={deleting === doc.id}
                        className="h-8 w-8"
                      >
                        {deleting === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
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
