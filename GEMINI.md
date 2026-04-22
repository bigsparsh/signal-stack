# Signalstack

## Project Overview
Signalstack is a log ingestion platform that provides an SDK to integrate with client backends. It captures logs and transmits them to the Signalstack backend, which then routes them through a caching layer and a queue. From the queue, logs are processed by a LangChain-powered backend to build context. Users can then monitor uptime, log activities, and crash reports via a chat interface on the frontend.

The project is composed of the following services:
- **frontend**: A Next JS frontend web application.
  - Features: Google & GitHub Auth (Auth.js), Prisma Integration, Project Dashboard, Log Analysis Tabs.
- **backend**: A Python application (requiring Python >= 3.13) managed and run using `uv`.
  - Features: FastAPI server with `/ingest` endpoint for log collection, SQLAlchemy models for DB interaction.
- **mock-client-backend**: A TypeScript-based Node.js backend module.
  - Features: Signalstack TypeScript SDK, periodic log generation for testing.

## Feature Status
- **Auth**: Google & GitHub login implemented.
- **Database**: Prisma models for `User`, `Project`, and `Log`.
- **SDK**: TypeScript SDK for client-side logging (`Signalstack` class).
- **Log Management**:
  - **Ingestion**: Backend API receives and validates logs via API Key.
  - **Dashboard**: View, connect, and navigate through client backends.
  - **Logs View**: Real-time log table in the frontend.
  - **AI Chat**: Query your logs using natural language (mocked).
  - **Reports**: System health visualizations (placeholder).

## Building and Running

### Frontend
The frontend is built using Nuxt and managed with `pnpm`.
- **Install dependencies:** `cd frontend && pnpm install`
- **Development server:** `cd frontend && pnpm dev` (runs on `http://localhost:3000`)
- **Production build:** `cd frontend && pnpm build`
- **Preview build:** `cd frontend && pnpm preview`

### Backend
The backend uses `uv` for dependency management and execution.
- **Run application:** `cd backend && uv run main.py`

### Mock Client Backend
Managed via `pnpm`.
- **Install dependencies:** `cd mock-client-backend && pnpm install`
- **Run application:** *TODO* (No run script specified yet)

## Development Conventions
- **Package Manager:** Use `pnpm` for any Node.js dependency management in both the `frontend` and `mock-client-backend` directories, as evidenced by `pnpm-lock.yaml` and package manager settings.
- **Python Version:** The backend requires Python 3.13 or higher. Ensure any new syntax or dependencies are compatible with this version.
