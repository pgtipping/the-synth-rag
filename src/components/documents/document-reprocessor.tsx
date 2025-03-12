import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "../../components/ui/use-toast";

interface DocumentReprocessorProps {
  documentId: number;
  onSuccess?: () => void;
  errorMessage?: string | null;
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

      const response = await fetch("/api/documents/reprocess", {
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
        title: "Document reprocessed",
        description:
          "The document has been successfully reprocessed and indexed.",
      });

      if (onSuccess) {
        onSuccess();
      }
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
    <div className="flex flex-col gap-2">
      {errorMessage && (
        <div className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          <span>Processing failed: {errorMessage}</span>
        </div>
      )}
      <Button
        variant={errorMessage ? "destructive" : "outline"}
        size="sm"
        onClick={handleReprocess}
        disabled={isProcessing}
        className="gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Reprocessing...
          </>
        ) : errorMessage ? (
          <>
            <RefreshCw className="h-4 w-4" />
            Fix Document
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Reprocess
          </>
        )}
      </Button>
    </div>
  );
}
