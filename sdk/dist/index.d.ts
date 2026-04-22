import { RequestHandler } from 'express';

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

type LogLevel = "info" | "warn" | "error" | "debug" | "fatal";
interface SignalstackConfig {
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
interface LogEntry {
    level: LogLevel;
    message: string;
    metadata?: string;
    source?: string;
    timestamp?: string;
}
declare class Signalstack {
    private apiKey;
    private endpoint;
    private source;
    private batchSize;
    private flushIntervalMs;
    private buffer;
    private timer;
    constructor(config: SignalstackConfig);
    /**
     * Send a log entry with a specific module name.
     * Format: [timestamp]-[module]- message
     */
    logWithModule(moduleName: string, level: LogLevel, message: string, meta?: Record<string, unknown>): Promise<void>;
    /**
     * Express middleware that automatically logs incoming requests.
     */
    middleware(moduleName?: string): RequestHandler;
    info(message: string, meta?: Record<string, unknown>): Promise<void>;
    warn(message: string, meta?: Record<string, unknown>): Promise<void>;
    error(message: string, meta?: Record<string, unknown>): Promise<void>;
    debug(message: string, meta?: Record<string, unknown>): Promise<void>;
    fatal(message: string, meta?: Record<string, unknown>): Promise<void>;
    private enqueue;
    /** Flush all buffered logs to the Signalstack backend. */
    flush(): Promise<void>;
    /** Gracefully shut down — flush remaining logs and clear the timer. */
    shutdown(): Promise<void>;
}

export { type LogEntry, type LogLevel, Signalstack, type SignalstackConfig };
