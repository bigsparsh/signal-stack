# @signalstack/sdk

Signalstack TypeScript SDK for structured log ingestion.

## Installation

```bash
npm install @signalstack/sdk
# or
pnpm add @signalstack/sdk
# or
yarn add @signalstack/sdk
```

## Quick Start

```typescript
import { Signalstack } from "@signalstack/sdk";

const logger = new Signalstack({
  apiKey: "YOUR_PROJECT_API_KEY",
  endpoint: "https://api.signalstack.com", // optional
  source: "my-service", // optional
});

// Send a simple log
await logger.info("Server started", { port: 3000 });

// Send a log with a specific module and format
// Format: [timestamp]-[module]- message
await logger.logWithModule("auth", "info", "User logged in");

// Express Middleware
import express from "express";
const app = express();

app.use(logger.middleware("api-gateway"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(3000);
```

## Features

- **Automatic Express Middleware:** Logs all incoming requests, including duration and status codes.
- **Formatted Logs:** Special `logWithModule` function that formats logs as `[timestamp]-[module]- message`.
- **Batching & Flushing:** Efficiently buffers logs and flushes them in batches to reduce network overhead.
- **Graceful Shutdown:** Flush remaining logs on application exit.

## API Reference

### `new Signalstack(config: SignalstackConfig)`

- `apiKey`: string (Required)
- `endpoint`: string (Default: http://localhost:8000)
- `source`: string (Optional default source name)
- `batchSize`: number (Default: 1)
- `flushIntervalMs`: number (Default: 5000ms)

### `logger.logWithModule(module: string, level: LogLevel, message: string, meta?: object)`
Sends a log entry with the formatted message: `[timestamp]-[module]- message`.

### `logger.middleware(moduleName?: string)`
Returns an Express middleware for automatic request logging.

### Standard Logging Methods
- `logger.info(message, meta?)`
- `logger.warn(message, meta?)`
- `logger.error(message, meta?)`
- `logger.debug(message, meta?)`
- `logger.fatal(message, meta?)`

### `logger.shutdown()`
Flushes the buffer and clears internal timers.

## License

MIT
