import { Card } from "../../components/ui/card";
import { DocumentList } from "./document-list";
import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

export function DocumentManager() {
  return (
    <div className="container mx-auto py-4 sm:py-6 px-3 sm:px-4 space-y-4 sm:space-y-6 max-w-full">
      {/* Breadcrumb */}
      <nav className="flex mb-4 sm:mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <Home className="h-4 w-4" />
            </Link>
          </li>
          <li className="flex items-center">
            <ChevronRight className="h-4 w-4 text-gray-500" />
            <Link
              href="/documents"
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              Documents
            </Link>
          </li>
        </ol>
      </nav>

      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Document Management
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          View and manage your uploaded documents across different use cases
        </p>
      </div>
      <Card className="w-full mx-auto p-3 sm:p-4 md:p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <DocumentList />
        </div>
      </Card>
    </div>
  );
}
