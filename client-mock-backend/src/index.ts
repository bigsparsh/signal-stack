/**
 * Mock Client Backend
 *
 * Simulates a production backend that generates periodic log events
 * and sends them to the Signalstack ingestion API via the SDK.
 * Now includes an Express server for middleware demonstration.
 */

import { Signalstack } from "@signalstack/sdk";
import express from "express";

// ─── Configuration ──────────────────────────────────────────────────────────

const API_KEY = process.env["SIGNALSTACK_API_KEY"] ?? "test-api-key";
const ENDPOINT = process.env["SIGNALSTACK_ENDPOINT"] ?? "http://localhost:8000";
const INTERVAL_MS = 3000; // Generate a log every 3 seconds
const PORT = 4000;

const logger = new Signalstack({
  apiKey: API_KEY,
  endpoint: ENDPOINT,
  source: "mock-client-backend",
  batchSize: 1, // Immediate for demo
  flushIntervalMs: 2000,
});

// ─── Express Server ─────────────────────────────────────────────────────────

const app = express();

// Use Signalstack Express middleware
app.use(logger.middleware("api-gateway"));

app.get("/", (req, res) => {
  void logger.logWithModule("home", "info", "Home page accessed");
  res.send("Signalstack SDK Test Server Running!");
});

app.get("/api/users", (req, res) => {
  void logger.logWithModule("users", "info", "Fetching user list");
  res.json({ users: [{ id: 1, name: "Alice" }] });
});

app.get("/api/error", (req, res) => {
  void logger.logWithModule("error-demo", "error", "Testing manual error logging");
  res.status(500).send("Simulated error!");
});

app.listen(PORT, () => {
  console.log(`📡 Express server listening at http://localhost:${PORT}`);
});

// ─── Log Generators ─────────────────────────────────────────────────────────

const infoMessages = [
  "Request completed: GET /api/v1/users 200 OK",
  "Cache hit for key: session_token_xyz",
  "Health check passed. All services responsive.",
  "New user registered: user_abc123",
  "Payment processed successfully: $29.99",
  "Email notification queued: welcome_email",
  "Database connection pool: 12/20 active",
  "Deployment v2.14.3 rolled out successfully",
];

const warnMessages = [
  "Slow query detected: SELECT * FROM orders (1240ms)",
  "Memory usage exceeded 80% threshold",
  "Rate limit approaching: 89/100 requests in window",
  "Deprecated API endpoint called: /api/v1/legacy",
  "SSL certificate expires in 14 days",
];

const errorMessages = [
  "Connection refused: ECONNREFUSED 10.0.0.5:5432",
  "Unhandled promise rejection: TypeError: Cannot read property 'id'",
  "Failed to process webhook payload: invalid signature",
  "Authentication failed: invalid token for user_def456",
  "Timeout waiting for response from upstream service",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function generateLog(): void {
  const roll = Math.random();

  if (roll < 0.6) {
    // 60% info
    void logger.info(pickRandom(infoMessages), {
      responseTimeMs: Math.floor(Math.random() * 200),
    });
  } else if (roll < 0.85) {
    // 25% warn
    void logger.warn(pickRandom(warnMessages), {
      threshold: "80%",
    });
  } else if (roll < 0.97) {
    // 12% error
    void logger.error(pickRandom(errorMessages), {
      stack: "Error: ...\n    at Object.<anonymous> (server.ts:42:15)",
    });
  } else {
    // 3% debug
    void logger.debug("Processing batch: items queued", {
      queueSize: Math.floor(Math.random() * 50),
    });
  }
}

// ─── Main Loop ──────────────────────────────────────────────────────────────

console.log("🚀 Mock client backend started");
console.log(`   Endpoint: ${ENDPOINT}`);
console.log(`   API Key:  ${API_KEY}`);
console.log(`   Interval: ${INTERVAL_MS}ms\n`);

const interval = setInterval(generateLog, INTERVAL_MS);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down mock client...");
  clearInterval(interval);
  await logger.shutdown();
  process.exit(0);
});
