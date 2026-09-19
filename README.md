# Time Tracking Website

## Project Overview

This project provides a real-time tracking dashboard designed for small teams of 10–20 users to monitor the balance between active work and idle time. It features a live status board showing who is currently active or AFK (Away From Keyboard), alongside analytics that calculate average weekly performance metrics. By translating user activity data into clear insights, it helps teams optimize workflows, balance workloads, and keep accurate operational records without the overhead of heavy enterprise software.

What began as a lightweight data-tracking spreadsheet has evolved into a fully responsive web application, with active development underway to expand into a multi-tenant client-server architecture featuring tailored Work and Study environments.

---

## Technical Evolution & Roadmap

```mermaid
graph TD
    subgraph "Phase 1: Origin (Spreadsheet Prototype)"
        A[Google Sheets + Apps Script] -->|Manual Export| B[Formula/Cell Bottlenecks]
    end

    subgraph "Phase 2: Current Web Platform"
        B --> C[React + TypeScript Frontend]
        C --> D[Shadcn UI + Tailwind CSS]
        C --> E[Supabase Client & RLS Backend]
        
        subgraph "Role-Based Modules"
            C --> F[User Dashboard]
            C --> G[Admin/Supervisor Panel]
        end
    end

    subgraph "Phase 3: Planned Platform Expansion"
        C --> H[Work Mode Engine]
        C --> I[Study / Focus Mode Engine]
        E --> J[Real-time WebSockets Engine]
    end
