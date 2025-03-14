import { useState, useEffect, useCallback } from "react";
import { Button } from "../../components/ui/button";
import { Loader2, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { useToast } from "../../components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Progress } from "../../components/ui/progress";

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

interface ReconciliationStatus {
  documentId: number;
  status: string;
  errorMessage: string | null;
  progress: {
    total: number;
    reconciled: number;
    percentage: number;
  };
  isComplete: boolean;
  isFailed: boolean;
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
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconciliationStatus, setReconciliationStatus] =
    useState<ReconciliationStatus | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const { toast } = useToast();

  // Function to check reconciliation status
  const checkReconciliationStatus = useCallback(async () => {
    if (!documentId) return;

    try {
      const response = await fetch(
        `/api/documents/reconcile?documentId=${documentId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to check reconciliation status"
        );
      }

      const status = await response.json();
      setReconciliationStatus(status);

      // If reconciliation is complete or failed, stop polling and refresh health check
      if (status.isComplete || status.isFailed) {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }

        setIsReconciling(false);

        // Show appropriate toast
        if (status.isComplete) {
          toast({
            title: "Document reconciliation complete",
            description: "Your document has been successfully reconciled.",
            variant: "default",
          });

          // Refresh health check
          handleHealthCheck();
        } else if (status.isFailed) {
          toast({
            title: "Document reconciliation failed",
            description:
              status.errorMessage || "An error occurred during reconciliation.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error checking reconciliation status:", error);
    }
  }, [documentId, pollingInterval, toast]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

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
      setIsReconciling(true);

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

      // Successfully started reconciliation
      toast({
        title: "Document reconciliation started",
        description:
          "Your document is being reconciled. This may take a moment.",
      });

      // Start polling for status updates
      // Check status immediately
      await checkReconciliationStatus();

      // Then set up interval for continued polling
      const interval = setInterval(checkReconciliationStatus, 2000);
      setPollingInterval(interval);

      // Keep the dialog open to show progress
    } catch (error) {
      console.error("Error reconciling document:", error);
      setIsReconciling(false);

      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to reconcile document",
        variant: "destructive",
      });
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

              {/* Reconciliation Status and Progress */}
              {isReconciling && reconciliationStatus && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">
                      Reconciliation Progress
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {reconciliationStatus.progress.reconciled} /{" "}
                      {reconciliationStatus.progress.total} chunks
                    </span>
                  </div>
                  <Progress
                    value={reconciliationStatus.progress.percentage}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Status: {reconciliationStatus.status}
                    {reconciliationStatus.errorMessage && (
                      <span className="text-red-500">
                        {" "}
                        - Error: {reconciliationStatus.errorMessage}
                      </span>
                    )}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {/* Refresh button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleHealthCheck}
                  disabled={isChecking || isReconciling}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>

                {/* Reconcile button - only show if unhealthy and not already reconciling */}
                {healthResult.status === "unhealthy" && !isReconciling && (
                  <Button
                    onClick={handleReconcile}
                    disabled={isChecking || isReconciling}
                    size="sm"
                  >
                    {isReconciling ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Reconcile Document"
                    )}
                  </Button>
                )}

                {/* Cancel button - only show if reconciling */}
                {isReconciling && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
