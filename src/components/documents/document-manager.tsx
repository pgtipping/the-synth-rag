import { Card } from "../../components/ui/card";
import { DocumentList } from "./document-list";

export function DocumentManager() {
  return (
    <Card className="w-full max-w-5xl mx-auto p-6">
      <DocumentList />
    </Card>
  );
}
