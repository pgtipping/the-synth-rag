import { Metadata } from "next";
import UsageAlerts from "@/src/components/admin/UsageAlerts";

export const metadata: Metadata = {
  title: "Usage Alerts | Admin",
  description: "Monitor unusual usage patterns and cost spikes",
};

// Add dynamic rendering to prevent static generation
export const dynamic = "force-dynamic";

export default function UsageAlertsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Usage Alerts</h1>
        <p className="text-gray-600">
          Monitor unusual usage patterns, cost spikes, and quota limits
        </p>
      </div>

      <UsageAlerts />
    </div>
  );
}
