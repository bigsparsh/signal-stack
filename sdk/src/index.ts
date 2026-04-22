/**
 * Signalstack TypeScript SDK
 *
 * Drop-in client for sending structured logs to the Signalstack backend.
 *
 * @example
 * ```ts
 * const logger = new Signalstack({
 *   apiKey: "sk_live_abc123",
 *   endpoint: "http://localhost:8000",
 * });
 *
 * // Express Middleware
 * app.use(logger.middleware());
 *
 * // Manual Log with Module
 * logger.logWithModule("auth", "info", "User logged in");
 * ```
 */

import type { Request, Response, NextFunction, RequestHandler } from "express";

export type LogLevel = "info" | "warn" | "error" | "debug" | "fatal";

export interface SignalstackConfig {
  /** Project API key issued by Signalstack. */
  apiKey: string;
  /** Signalstack backend URL (default: http://localhost:8000). */
  endpoint?: string;
  /** Optional default source identifier (e.g. "api-gateway", "worker-01"). */
  source?: string;
  /** Batch size before auto-flush (default: 1). */
  batchSize?: number;
  /** Flush interval in milliseconds (default: 5000). */
  flushIntervalMs?: number;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  metadata?: string;
  source?: string;
  timestamp?: string;
}

export class Signalstack {
  private apiKey: string;
  private endpoint: string;
  private source: string | undefined;
  private batchSize: number;
  private flushIntervalMs: number;
  private buffer: LogEntry[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(config: SignalstackConfig) {
    this.apiKey = config.apiKey;
    this.endpoint = (config.endpoint ?? "http://localhost:8000").replace(
      /\/$/,
      ""
    );
    this.source = config.source;
    this.batchSize = config.batchSize ?? 1; // Default to immediate for responsiveness unless specified
    this.flushIntervalMs = config.flushIntervalMs ?? 5000;

    // Start periodic flush
    this.timer = setInterval(() => {
      void this.flush();
    }, this.flushIntervalMs);
  }

  // ─── Formatted Logging ───────────────────────────────────────────────────

  /**
   * Send a log entry with a specific module name.
   * Format: [timestamp]-[module]- message
   */
  async logWithModule(
    moduleName: string,
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}]-[${moduleName}]- ${message}`;
    
    await this.enqueue(level, formattedMessage, {
      ...meta,
      module: moduleName,
      rawMessage: message,
    });
  }

  // ─── Express Middleware ──────────────────────────────────────────────────

  /**
   * Express middleware that automatically logs incoming requests.
   */
  middleware(moduleName: string = "http"): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();

      // Record original end to intercept response completion
      const originalEnd = res.end;
      const self = this;
      
      // We wrap the end function to log when the request finishes
      res.end = function(this: Response, chunk?: any, encoding?: any, cb?: any) {
        const duration = Date.now() - start;
        const level: LogLevel = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
        
        const message = `${req.method} ${req.originalUrl || req.url} ${res.statusCode} (${duration}ms)`;
        
        void self.logWithModule(moduleName, level, message, {
          method: req.method,
          url: req.originalUrl || req.url,
          status: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get("user-agent"),
        });

        return originalEnd.call(this, chunk, encoding, cb);
      } as any;

      next();
    };
  }

  // ─── Standard API ────────────────────────────────────────────────────────

  async info(message: string, meta?: Record<string, unknown>): Promise<void> {
    await this.enqueue("info", message, meta);
  }

  async warn(message: string, meta?: Record<string, unknown>): Promise<void> {
    await this.enqueue("warn", message, meta);
  }

  async error(message: string, meta?: Record<string, unknown>): Promise<void> {
    await this.enqueue("error", message, meta);
  }

  async debug(message: string, meta?: Record<string, unknown>): Promise<void> {
    await this.enqueue("debug", message, meta);
  }

  async fatal(message: string, meta?: Record<string, unknown>): Promise<void> {
    await this.enqueue("fatal", message, meta);
  }

  // ─── Internals ───────────────────────────────────────────────────────────

  private async enqueue(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>
  ): Promise<void> {
    const entry: LogEntry = {
      level,
      message,
      metadata: meta ? JSON.stringify(meta) : undefined,
      source: this.source,
      timestamp: new Date().toISOString(),
    };

    this.buffer.push(entry);

    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  /** Flush all buffered logs to the Signalstack backend. */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = [...this.buffer];
    this.buffer = [];

    try {
      const res = await fetch(`${this.endpoint}/api/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        body: JSON.stringify({ logs: batch }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          `[Signalstack] Ingest failed (${res.status}): ${errorText}`
        );
        // Put logs back in buffer for retry (if not 4xx)
        if (res.status >= 500) {
          this.buffer.unshift(...batch);
        }
      }
    } catch (err) {
      console.error("[Signalstack] Network error:", err);
      this.buffer.unshift(...batch);
    }
  }

  /** Gracefully shut down — flush remaining logs and clear the timer. */
  async shutdown(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.flush();
  }
}
