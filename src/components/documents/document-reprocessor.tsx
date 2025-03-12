import { useState } from "react";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "../ui/use-toast";

interface DocumentReprocessorProps {
  documentId: number;
  onSuccess: () => void;
  errorMessage: string | null;
}

export function DocumentReprocessor({
  documentId,
  onSuccess,
  errorMessage,
}: DocumentReprocessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleReprocess = async () => {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/documents/reprocess`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reprocess document");
      }

      toast({
        title: "Document processing started",
        description:
          "Your document is being processed. This may take a moment.",
      });

      // Call the onSuccess callback to refresh the document list
      onSuccess();
    } catch (error) {
      console.error("Error reprocessing document:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to reprocess document",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      variant={errorMessage ? "destructive" : "secondary"}
      size="sm"
      onClick={handleReprocess}
      disabled={isProcessing}
      className="text-xs"
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Processing...
        </>
      ) : errorMessage ? (
        "Fix Document"
      ) : (
        "Process Document"
      )}
    </Button>
  );
}
