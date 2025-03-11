import { NextResponse } from "next/server";
import { ProgressService } from "@/lib/services/progress-service";
import { sql } from "@vercel/postgres";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    // Rate limiting
    const limiter = await rateLimit("admin_metrics");
    const remaining = await limiter.remaining();
    if (!remaining) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "24h";
    const filter = searchParams.get("filter") || "all";

    // Convert time range to hours
    const hours = timeRange === "1h" ? 1 : timeRange === "7d" ? 168 : 24;

    const progressService = new ProgressService();

    // Get metrics and problematic sessions
    const [metrics, problematicSessions, healthMetrics] = await Promise.all([
      progressService.getSystemMetrics({ hours }),
      progressService.getProblematicSessions({ hours }, filter as any),
      getHealthMetrics(),
    ]);

    return NextResponse.json({
      metrics,
      problematicSessions,
      healthMetrics,
      _meta: {
        timestamp: new Date().toISOString(),
        timeRange,
        filter,
      },
    });
  } catch (error) {
    console.error("Metrics API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function getHealthMetrics() {
  try {
    // Check database connection
    const dbStart = Date.now();
    await sql`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    // Get database stats
    const dbStats = await sql`
      SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_sessions,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_sessions
      FROM progress_sessions 
      WHERE created_at >= NOW() - INTERVAL '1 hour'
    `;

    // Get memory usage
    const memory = process.memoryUsage();

    return {
      database: {
        status: "connected",
        latency: dbLatency,
        hourlyStats: dbStats.rows[0],
      },
      system: {
        memory: {
          heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
          rss: Math.round(memory.rss / 1024 / 1024),
        },
        uptime: process.uptime(),
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      database: {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      timestamp: new Date().toISOString(),
    };
  }
}
