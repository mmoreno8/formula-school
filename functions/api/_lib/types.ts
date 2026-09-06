export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
}

export interface D1DatabaseLike {
  prepare(sql: string): D1Statement;
}

export interface AuthEnv {
  DB: D1DatabaseLike;
  GOOGLE_CLIENT_ID: string;
  SESSION_SECRET: string;
}

export interface FunctionContext {
  request: Request;
  env: AuthEnv;
}
