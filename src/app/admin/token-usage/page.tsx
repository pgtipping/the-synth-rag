import React from "react";
import { Metadata } from "next";
import TokenUsageDashboard from "@/src/components/admin/TokenUsageDashboard";

export const metadata: Metadata = {
  title: "Token Usage Dashboard | Admin",
  description: "Monitor and analyze token usage across the application",
};

export default function TokenUsagePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Token Usage Dashboard</h1>
        <p className="text-gray-600">
          Monitor token usage, costs, and trends across different models and
          features
        </p>
      </div>

      <TokenUsageDashboard />
    </div>
  );
}
