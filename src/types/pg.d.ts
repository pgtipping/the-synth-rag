declare module "pg" {
  // Minimal declaration to satisfy TypeScript for the pg module
  export interface PoolConfig {
    connectionString?: string;
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    ssl?: boolean | object;
    [key: string]: string | number | boolean | object | undefined;
  }

  export interface QueryResult<T = unknown> {
    rows: T[];
    rowCount: number;
    command: string;
    oid: number;
    fields: Array<{
      name: string;
      tableID: number;
      columnID: number;
      dataTypeID: number;
      dataTypeSize: number;
      dataTypeModifier: number;
      format: string;
    }>;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
    query<T = unknown>(
      text: string,
      params?: unknown[]
    ): Promise<QueryResult<T>>;
  }

  export interface PoolClient {
    query<T = unknown>(
      text: string,
      params?: unknown[]
    ): Promise<QueryResult<T>>;
    release(): void;
  }
  // You can add more detailed types here if needed.
}
