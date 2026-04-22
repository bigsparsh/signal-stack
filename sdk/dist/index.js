// src/index.ts
var Signalstack = class {
  apiKey;
  endpoint;
  source;
  batchSize;
  flushIntervalMs;
  buffer = [];
  timer = null;
  constructor(config) {
    this.apiKey = config.apiKey;
    this.endpoint = (config.endpoint ?? "http://localhost:8000").replace(
      /\/$/,
      ""
    );
    this.source = config.source;
    this.batchSize = config.batchSize ?? 1;
    this.flushIntervalMs = config.flushIntervalMs ?? 5e3;
    this.timer = setInterval(() => {
      void this.flush();
    }, this.flushIntervalMs);
  }
  // ─── Formatted Logging ───────────────────────────────────────────────────
  /**
   * Send a log entry with a specific module name.
   * Format: [timestamp]-[module]- message
   */
  async logWithModule(moduleName, level, message, meta) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const formattedMessage = `[${timestamp}]-[${moduleName}]- ${message}`;
    await this.enqueue(level, formattedMessage, {
      ...meta,
      module: moduleName,
      rawMessage: message
    });
  }
  // ─── Express Middleware ──────────────────────────────────────────────────
  /**
   * Express middleware that automatically logs incoming requests.
   */
  middleware(moduleName = "http") {
    return (req, res, next) => {
      const start = Date.now();
      const originalEnd = res.end;
      const self = this;
      res.end = function(chunk, encoding, cb) {
        const duration = Date.now() - start;
        const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
        const message = `${req.method} ${req.originalUrl || req.url} ${res.statusCode} (${duration}ms)`;
        void self.logWithModule(moduleName, level, message, {
          method: req.method,
          url: req.originalUrl || req.url,
          status: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get("user-agent")
        });
        return originalEnd.call(this, chunk, encoding, cb);
      };
      next();
    };
  }
  // ─── Standard API ────────────────────────────────────────────────────────
  async info(message, meta) {
    await this.enqueue("info", message, meta);
  }
  async warn(message, meta) {
    await this.enqueue("warn", message, meta);
  }
  async error(message, meta) {
    await this.enqueue("error", message, meta);
  }
  async debug(message, meta) {
    await this.enqueue("debug", message, meta);
  }
  async fatal(message, meta) {
    await this.enqueue("fatal", message, meta);
  }
  // ─── Internals ───────────────────────────────────────────────────────────
  async enqueue(level, message, meta) {
    const entry = {
      level,
      message,
      metadata: meta ? JSON.stringify(meta) : void 0,
      source: this.source,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.buffer.push(entry);
    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }
  /** Flush all buffered logs to the Signalstack backend. */
  async flush() {
    if (this.buffer.length === 0) return;
    const batch = [...this.buffer];
    this.buffer = [];
    try {
      const res = await fetch(`${this.endpoint}/api/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey
        },
        body: JSON.stringify({ logs: batch })
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          `[Signalstack] Ingest failed (${res.status}): ${errorText}`
        );
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
  async shutdown() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.flush();
  }
};
export {
  Signalstack
};
