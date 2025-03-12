"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  receivedAt: string;
  status: string;
}

export default function EmailsAdminPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmails() {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/emails");

        if (!response.ok) {
          throw new Error(`Failed to fetch emails: ${response.statusText}`);
        }

        const data = await response.json();
        setEmails(data.emails);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching emails:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEmails();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          <h3 className="text-lg font-medium">Error loading emails</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Email Management</h1>

      {emails.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">No emails received yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-3 border-b">From</th>
                <th className="text-left p-3 border-b">Subject</th>
                <th className="text-left p-3 border-b">Received</th>
                <th className="text-left p-3 border-b">Status</th>
                <th className="text-left p-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {emails.map((email) => (
                <tr key={email.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{email.from}</td>
                  <td className="p-3">{email.subject}</td>
                  <td className="p-3">
                    {formatDistanceToNow(new Date(email.receivedAt), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        email.status === "UNREAD"
                          ? "bg-blue-100 text-blue-800"
                          : email.status === "READ"
                          ? "bg-gray-100 text-gray-800"
                          : email.status === "REPLIED"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {email.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() =>
                        (window.location.href = `/admin/emails/${email.id}`)
                      }
                      className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
