import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "../../components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";

interface DocumentHealthCheckProps {
  documentId: number;
  onHealthCheck?: (result: HealthCheckResult) => void;
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

export function DocumentHealthCheck({
  documentId,
  onHealthCheck,
}: DocumentHealthCheckProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(
    null
  );
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleHealthCheck = async () => {
    try {
      setIsChecking(true);
      setHealthResult(null);

      const response = await fetch(
        `/api/documents/health?documentId=${documentId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to check document health");
      }

      const result = await response.json();
      setHealthResult(result);

      if (onHealthCheck) {
        onHealthCheck(result);
      }

      // Open dialog to show results
      setIsOpen(true);
    } catch (error) {
      console.error("Error checking document health:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to check document health",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleReconcile = async () => {
    try {
      setIsChecking(true);

      const response = await fetch(`/api/documents/reconcile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reconcile document");
      }

      toast({
        title: "Document reconciliation started",
        description:
          "Your document is being reconciled. This may take a moment.",
      });

      // Close the dialog
      setIsOpen(false);
    } catch (error) {
      console.error("Error reconciling document:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to reconcile document",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleHealthCheck}
        disabled={isChecking}
        className="text-xs"
      >
        {isChecking ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Checking...
          </>
        ) : (
          "Health Check"
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Document Health Check</DialogTitle>
            <DialogDescription>
              Results of the document health check
            </DialogDescription>
          </DialogHeader>

          {healthResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{healthResult.documentName}</h3>
                <Badge
                  variant={
                    healthResult.status === "healthy"
                      ? "success"
                      : "destructive"
                  }
                  className={
                    healthResult.status === "healthy"
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                  }
                >
                  {healthResult.status === "healthy" ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {healthResult.status}
                </Badge>
              </div>

              {healthResult.issues.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Issues Found</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {healthResult.issues.map((issue, index) => (
                        <li key={index} className="text-sm">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-muted p-3 rounded-md">
                <h4 className="font-medium mb-2">Details</h4>
                <ul className="space-y-1 text-sm">
                  <li>Total Chunks: {healthResult.details.totalChunks}</li>
                  <li>
                    Chunks with Vectors:{" "}
                    {healthResult.details.chunksWithVectors}
                  </li>
                  <li>
                    Chunks without Vectors:{" "}
                    {healthResult.details.chunksWithoutVectors}
                  </li>
                  <li>
                    Vectors in Pinecone:{" "}
                    {healthResult.details.vectorsInPinecone}
                  </li>
                </ul>
              </div>

              {healthResult.status === "unhealthy" && (
                <div className="flex justify-end">
                  <Button
                    onClick={handleReconcile}
                    disabled={isChecking}
                    size="sm"
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Reconcile Document"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
