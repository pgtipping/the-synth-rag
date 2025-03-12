"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  textContent: string;
  htmlContent: string | null;
  receivedAt: string;
  status: string;
  replies: Reply[];
}

interface Reply {
  id: string;
  to: string;
  from: string;
  subject: string;
  textContent: string;
  sentAt: string;
}

export default function EmailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function fetchEmail() {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/emails/${params.id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch email: ${response.statusText}`);
        }

        const data = await response.json();
        setEmail(data.email);

        // Mark as read if unread
        if (data.email.status === "UNREAD") {
          await fetch(`/api/admin/emails/${params.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "READ" }),
          });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching email:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEmail();
  }, [params.id]);

  async function handleReply() {
    if (!replyContent.trim() || !email) return;

    setSending(true);
    try {
      const response = await fetch("/api/admin/emails/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inboundEmailId: email.id,
          content: replyContent,
          subject: `Re: ${email.subject}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send reply: ${response.statusText}`);
      }

      // Refresh email data
      const emailResponse = await fetch(`/api/admin/emails/${params.id}`);
      const data = await emailResponse.json();
      setEmail(data.email);
      setReplyContent("");

      alert("Reply sent successfully!");
    } catch (err) {
      alert(
        `Error sending reply: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      console.error("Error sending reply:", err);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          <h3 className="text-lg font-medium">Error loading email</h3>
          <p>{error || "Email not found"}</p>
          <button
            onClick={() => router.push("/admin/emails")}
            className="mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
          >
            Back to Emails
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <button
          onClick={() => router.push("/admin/emails")}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Emails
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex justify-between items-start">
            <h1 className="text-xl font-semibold">{email.subject}</h1>
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
          </div>
          <div className="text-sm text-gray-600 mt-2">
            <p>
              <strong>From:</strong> {email.from}
            </p>
            <p>
              <strong>To:</strong> {email.to}
            </p>
            <p>
              <strong>Received:</strong>{" "}
              {format(new Date(email.receivedAt), "PPpp")}
            </p>
          </div>
        </div>

        <div className="p-4">
          {email.htmlContent ? (
            <div dangerouslySetInnerHTML={{ __html: email.htmlContent }} />
          ) : (
            <pre className="whitespace-pre-wrap font-sans">
              {email.textContent}
            </pre>
          )}
        </div>
      </div>

      {email.replies.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Replies</h2>
          {email.replies.map((reply) => (
            <div
              key={reply.id}
              className="bg-white rounded-lg shadow-md overflow-hidden mb-3 border-l-4 border-green-500"
            >
              <div className="p-4 border-b bg-gray-50">
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>From:</strong> {reply.from}
                  </p>
                  <p>
                    <strong>To:</strong> {reply.to}
                  </p>
                  <p>
                    <strong>Sent:</strong>{" "}
                    {format(new Date(reply.sentAt), "PPpp")}
                  </p>
                </div>
              </div>
              <div className="p-4">
                <pre className="whitespace-pre-wrap font-sans">
                  {reply.textContent}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold">Reply</h2>
        </div>
        <div className="p-4">
          <textarea
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={6}
            placeholder="Type your reply here..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
          ></textarea>

          <div className="mt-4 flex justify-end">
            <button
              className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                sending || !replyContent.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={handleReply}
              disabled={sending || !replyContent.trim()}
            >
              {sending ? "Sending..." : "Send Reply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
