"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Signalstack: () => Signalstack
});
module.exports = __toCommonJS(index_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Signalstack
});
