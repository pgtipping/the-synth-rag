import { Card } from "../../components/ui/card";
import { DocumentList } from "./document-list";

export function DocumentManager() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Document Management
        </h1>
        <p className="text-muted-foreground text-lg">
          View and manage your uploaded documents across different use cases
        </p>
      </div>
      <Card className="w-full mx-auto p-6 shadow-sm">
        <DocumentList />
      </Card>
    </div>
  );
}
