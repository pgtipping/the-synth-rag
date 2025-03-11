import { sql } from "@vercel/postgres";
import {
  ProgressSession,
  ProgressStep,
  ProgressMetric,
  ProgressStatus,
  ProgressUpdate,
  SessionProgress,
  StepType,
} from "@/types/progress";

interface DbRow {
  id: number;
  user_id?: string;
  session_id: string;
  use_case: string;
  start_time: string;
  end_time?: string;
  status: string;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
  step_type?: string;
  step_name?: string;
  metadata?: Record<string, unknown>;
  metric_name?: string;
  metric_value?: number;
  recorded_at?: string;
}

// Admin/Monitoring Methods
interface SystemMetrics {
  activeSessions: number;
  errorRate: number;
  avgCompletionTime: number;
  successRate: number;
}

interface TimeFilter {
  hours: number;
}

export class ProgressService {
  // Session Management
  async createSession(
    useCase: string,
    userId?: string
  ): Promise<ProgressSession> {
    const sessionId = crypto.randomUUID();
    const result = await sql<DbRow>`
      INSERT INTO progress_sessions (session_id, use_case, user_id, status)
      VALUES (${sessionId}, ${useCase}, ${userId}, 'active')
      RETURNING *
    `;
    return this.mapRowToSession(result.rows[0]);
  }

  async getSession(sessionId: string): Promise<SessionProgress | null> {
    const sessionResult = await sql<DbRow>`
      SELECT * FROM progress_sessions WHERE session_id = ${sessionId}
    `;

    if (sessionResult.rows.length === 0) {
      return null;
    }

    const session = this.mapRowToSession(sessionResult.rows[0]);

    const stepsResult = await sql<DbRow>`
      SELECT * FROM progress_steps 
      WHERE session_id = ${session.id} 
      ORDER BY created_at ASC
    `;

    const metricsResult = await sql<DbRow>`
      SELECT * FROM progress_metrics 
      WHERE session_id = ${session.id} 
      ORDER BY recorded_at DESC
    `;

    const steps = stepsResult.rows.map(this.mapRowToStep);
    const metrics = metricsResult.rows.map(this.mapRowToMetric);
    const currentStep =
      steps.find((step) => step.status === "active") || steps[steps.length - 1];

    return {
      session,
      steps,
      metrics,
      currentStep,
    };
  }

  // Step Management
  async createStep(
    sessionId: number,
    update: ProgressUpdate
  ): Promise<ProgressStep> {
    const result = await sql<DbRow>`
      INSERT INTO progress_steps (
        session_id, 
        step_type, 
        step_name, 
        status, 
        completion_percentage,
        metadata,
        start_time
      )
      VALUES (
        ${sessionId}, 
        ${update.stepType}, 
        ${update.stepName}, 
        ${update.status},
        ${update.completionPercentage},
        ${JSON.stringify(update.metadata || {})},
        CASE WHEN ${
          update.status
        } = 'active' THEN CURRENT_TIMESTAMP ELSE NULL END
      )
      RETURNING *
    `;
    return this.mapRowToStep(result.rows[0]);
  }

  async updateStep(
    stepId: number,
    update: Partial<ProgressUpdate>
  ): Promise<ProgressStep> {
    const updates: string[] = [];
    const values: unknown[] = [stepId];
    let paramCount = 2;

    if (update.status) {
      updates.push(`status = $${paramCount}`);
      values.push(update.status);
      paramCount++;

      if (update.status === "active") {
        updates.push(`start_time = CURRENT_TIMESTAMP`);
      } else if (update.status === "completed" || update.status === "failed") {
        updates.push(`end_time = CURRENT_TIMESTAMP`);
      }
    }

    if (typeof update.completionPercentage === "number") {
      updates.push(`completion_percentage = $${paramCount}`);
      values.push(update.completionPercentage);
      paramCount++;
    }

    if (update.metadata) {
      updates.push(`metadata = $${paramCount}`);
      values.push(JSON.stringify(update.metadata));
      paramCount++;
    }

    const result = await sql<DbRow>`
      UPDATE progress_steps 
      SET ${sql(updates.join(", "))}
      WHERE id = $1
      RETURNING *
    `;

    return this.mapRowToStep(result.rows[0]);
  }

  // Metrics Management
  async recordMetric(
    sessionId: number,
    name: string,
    value: number
  ): Promise<ProgressMetric> {
    const result = await sql<DbRow>`
      INSERT INTO progress_metrics (session_id, metric_name, metric_value)
      VALUES (${sessionId}, ${name}, ${value})
      RETURNING *
    `;
    return this.mapRowToMetric(result.rows[0]);
  }

  // Session Completion
  async completeSession(
    sessionId: string,
    completionPercentage: number
  ): Promise<ProgressSession> {
    const result = await sql<DbRow>`
      UPDATE progress_sessions 
      SET 
        status = 'completed',
        completion_percentage = ${completionPercentage},
        end_time = CURRENT_TIMESTAMP
      WHERE session_id = ${sessionId}
      RETURNING *
    `;
    return this.mapRowToSession(result.rows[0]);
  }

  // Mapping functions
  private mapRowToSession(row: DbRow): ProgressSession {
    return {
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      useCase: row.use_case,
      startTime: new Date(row.start_time),
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      status: row.status as ProgressStatus,
      completionPercentage: row.completion_percentage,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapRowToStep(row: DbRow): ProgressStep {
    if (!row.step_type || !row.step_name) {
      throw new Error("Invalid step data");
    }

    return {
      id: row.id,
      sessionId: row.id,
      stepType: row.step_type as StepType,
      stepName: row.step_name,
      status: row.status as ProgressStatus,
      startTime: row.start_time ? new Date(row.start_time) : undefined,
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      completionPercentage: row.completion_percentage,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapRowToMetric(row: DbRow): ProgressMetric {
    if (
      !row.metric_name ||
      typeof row.metric_value !== "number" ||
      !row.recorded_at
    ) {
      throw new Error("Invalid metric data");
    }

    return {
      id: row.id,
      sessionId: row.id,
      metricName: row.metric_name,
      metricValue: row.metric_value,
      recordedAt: new Date(row.recorded_at),
    };
  }

  async getSystemMetrics(timeFilter: TimeFilter): Promise<SystemMetrics> {
    const result = await sql<{
      active_count: number;
      error_count: number;
      total_count: number;
      success_count: number;
      avg_duration: number;
    }>`
      WITH time_filtered_sessions AS (
        SELECT *
        FROM progress_sessions
        WHERE created_at >= NOW() - INTERVAL '${timeFilter.hours} hours'
      )
      SELECT 
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as error_count,
        COUNT(*) as total_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as success_count,
        AVG(
          EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time))
        ) as avg_duration
      FROM time_filtered_sessions
    `;

    const metrics = result.rows[0];
    const totalCount = Number(metrics.total_count) || 1; // Prevent division by zero

    return {
      activeSessions: Number(metrics.active_count),
      errorRate: (Number(metrics.error_count) / totalCount) * 100,
      avgCompletionTime: Number(metrics.avg_duration) || 0,
      successRate: (Number(metrics.success_count) / totalCount) * 100,
    };
  }

  async getProblematicSessions(
    timeFilter: TimeFilter,
    filter: "all" | "error" | "slow"
  ): Promise<SessionProgress[]> {
    let filterClause = "";
    const slowThresholdSeconds = 300; // 5 minutes

    if (filter === "error") {
      filterClause = "AND s.status = 'failed'";
    } else if (filter === "slow") {
      filterClause = `
        AND s.status = 'active' 
        AND EXTRACT(EPOCH FROM (NOW() - s.start_time)) > ${slowThresholdSeconds}
      `;
    }

    const result = await sql<DbRow>`
      WITH filtered_sessions AS (
        SELECT *
        FROM progress_sessions s
        WHERE s.created_at >= NOW() - INTERVAL '${timeFilter.hours} hours'
        ${sql(filterClause)}
        ORDER BY 
          CASE 
            WHEN status = 'failed' THEN 1
            WHEN status = 'active' THEN 2
            ELSE 3
          END,
          created_at DESC
        LIMIT 10
      )
      SELECT 
        s.*,
        steps.step_type,
        steps.step_name,
        steps.status as step_status,
        steps.metadata,
        m.metric_name,
        m.metric_value,
        m.recorded_at
      FROM filtered_sessions s
      LEFT JOIN progress_steps steps ON s.id = steps.session_id
      LEFT JOIN progress_metrics m ON s.id = m.session_id
      ORDER BY s.created_at DESC, steps.created_at ASC
    `;

    // Group the rows by session
    const sessionsMap = new Map<string, SessionProgress>();

    for (const row of result.rows) {
      const sessionId = row.session_id;

      if (!sessionsMap.has(sessionId)) {
        sessionsMap.set(sessionId, {
          session: this.mapRowToSession(row),
          steps: [],
          metrics: [],
        });
      }

      const sessionProgress = sessionsMap.get(sessionId)!;

      if (
        row.step_type &&
        !sessionProgress.steps.find((s) => s.id === row.id)
      ) {
        sessionProgress.steps.push(this.mapRowToStep(row));
      }

      if (
        row.metric_name &&
        !sessionProgress.metrics.find((m) => m.id === row.id)
      ) {
        sessionProgress.metrics.push(this.mapRowToMetric(row));
      }
    }

    return Array.from(sessionsMap.values());
  }
}
