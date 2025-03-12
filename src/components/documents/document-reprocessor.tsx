import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "../../components/ui/use-toast";

interface DocumentReprocessorProps {
  documentId: number;
  onSuccess?: () => void;
}

export function DocumentReprocessor({
  documentId,
  onSuccess,
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
    <Button
      variant="outline"
      size="sm"
      onClick={handleReprocess}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Reprocessing...
        </>
      ) : (
        "Reprocess Document"
      )}
    </Button>
  );
}
