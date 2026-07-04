w# Feature Checklist

This document tracks the implementation status of all planned features for the AsyncHub MVP.

### Authentication
- ✅ User Signup
- ✅ User Login (OAuth2 Password)
- ✅ JWT Generation & Validation
- ✅ Automatic Token Refresh (Frontend interceptor)
- ✅ Logout flow

### Organizations
- ✅ Database Schema & Relationship mapping
- ✅ Create Organization API & UI Form
- ✅ Workspace Context Provider (Frontend)
- 🚧 Organization Settings / Member Management
- ❌ Invite Users via Email

### Projects
- ✅ Database Schema
- 🚧 Projects UI Page (Placeholder exists)
- ❌ Create / Edit Project UI
- ❌ Projects API Endpoints

### Queues
- ✅ Database Schema (Concurrency limits, priority, pause)
- 🚧 Queues UI Page (Placeholder exists)
- ❌ Create / Edit Queue UI
- ❌ Pause / Resume Queue UI
- ❌ Queues API Endpoints

### Workers
- ✅ Python CLI Worker Engine
- ✅ `SKIP LOCKED` Concurrency Polling
- ✅ Graceful Shutdown (SIGTERM handling)
- 🚧 Workers UI Dashboard (Placeholder exists)
- ❌ Live Worker Heartbeats (API)
- ❌ Concurrent Asyncio Execution within single worker

### Jobs
- ✅ Job Payload Processing
- ✅ Job Retries & `max_retries` logic
- ✅ Job State Transitions (Queued -> Running -> Completed/Failed)
- ✅ Job Events Audit Log
- ✅ Job Executions Detailed Tracebacks
- ✅ Jobs UI List View
- ✅ Job Details View
- ❌ Cancel Job (API + UI)
- ❌ Manual Retry Job from Jobs view

### Realtime
- ❌ WebSocket API Server
- ❌ PostgreSQL `LISTEN/NOTIFY` triggers
- ❌ React Query WebSocket invalidation

### Dashboard
- ✅ Sidebar Navigation Layout
- ✅ Top Navigation with Active Organization
- ✅ Command Palette (`cmdk` Search)
- ❌ High-level KPI widgets (Jobs processed, failure rate)

### Dead Letter Queue (DLQ)
- ✅ DLQ Identification (`dead` status)
- ✅ DLQ UI List
- ✅ DLQ Replay Job (API + UI)

### Analytics
- 🚧 Analytics UI Page (Placeholder exists)
- ❌ Aggregation Queries for Job metrics

### Workflow (DAGs)
- 🚧 Workflows UI Page (Placeholder exists)
- ❌ Dependent Jobs execution logic

### Scheduling
- 🚧 Schedules UI Page (Placeholder exists)
- ❌ `run_after` delayed job execution daemon
- ❌ Cron-based recurring jobs

### API
- ✅ Structured 3-Tier Architecture
- ✅ Global Error Handling
- ❌ API Key Generation & Revocation
- ❌ Rate Limiting

### Frontend
- ✅ Next.js App Router Structure
- ✅ Tailwind & Shadcn UI Theme
- ✅ GSAP Landing Page Animations
- ✅ Protected Routes
- ✅ Global Error Boundaries

### Documentation
- ✅ System Architecture
- ✅ Database Design
- ✅ API Design
- ✅ Worker Engine
- ✅ Queue Engine
- ✅ Architecture Decisions (ADR)
- ✅ Deployment Guide

### Testing
- ✅ Manual Seed Script (`scripts/seed.py`)
- ❌ Backend `pytest` Suite
- ❌ Frontend Component Tests
- ❌ End-to-End Tests

### Deployment
- ✅ Local Development Environment
- ❌ Dockerization (Dockerfiles & `docker-compose.yml`)
- ❌ CI/CD Pipeline (GitHub Actions)
