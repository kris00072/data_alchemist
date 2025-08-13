# Data Alchemist – Resource Allocation Configurator

A Next.js web app that turns raw CSV/XLSX datasets (clients, workers, tasks) into a clean, configurable resource allocation plan. Upload data, validate/fix it, define rules and priorities, preview insights and a simulated allocation, then export for downstream use.

## What you can do
- Upload data: Drag‑and‑drop CSV/XLSX for `clients`, `workers`, `tasks` (see samples/).
- Validate and auto‑fix: Missing columns, duplicate IDs, out‑of‑range values, broken references, malformed JSON.
- Explore data: Interactive grid and natural‑language search.
- Configure rules: Co‑run tasks, phase windows, load limits; convert natural language to rules.
- Set priorities: 0–100 weights for client priority, fulfillment, fairness, skill matching, deadlines, cost, etc.
- Preview & export: Simulated allocation with workload/efficiency/stress; export cleaned data and config.

## Flow
1. Data Ingestion – upload and parse CSV/XLSX files.
2. Data Validation – run checks and apply auto‑fix suggestions.
3. Rule Configuration – add rules manually or from natural language.
4. Priority Setup – adjust weights or choose a preset profile.
5. Preview & Export – review results and download outputs.

## Data formats (expected columns)
- Clients: `ClientID`, `ClientName`, `PriorityLevel` (1–5), `RequestedTaskIDs` (comma‑separated), `AttributesJSON`
- Workers: `WorkerID`, `WorkerName`, `Skills` (comma‑separated), `AvailableSlots`, `MaxLoadPerPhase`, `AttributesJSON`
- Tasks: `TaskID`, `TaskName`, `RequiredSkills` (comma‑separated), `Duration`, `AttributesJSON`

Use the sample files in `samples/` to try the app quickly.

## Priorities (weights)
- Sliders indicate relative importance of criteria (higher = stronger influence).
- Criteria include: client priority level, task fulfillment, worker load fairness, skill‑task matching, phase efficiency, resource utilization, deadline compliance, cost optimization.
- Drag to rank criteria; weights and order are exported with the run.

## Rules and exported config
- Export includes cleaned CSVs/XLSX plus `rules_config.json`:
  - rules: id, type, name, description, parameters
  - priorities: weights, criteria order, active preset
  - validation summary and metadata
- Downstream systems can reproduce the allocation logic using this file.

## Tech stack
- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui (Radix) + Lucide icons
- @tanstack/react-query, papaparse/xlsx

AI logic in `src/lib/aiService.ts` is a mock for this assignment (insights, NL rule parsing, auto‑fix ideas, and a simple optimizer). Swap with real APIs if needed.

## Run locally
Requires Node.js 18+

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`

Production build:
```bash
npm run build
npm start
```

## Project structure (high level)
```
src/
  app/
    layout.tsx
    page.tsx
    not-found.tsx
    providers.tsx
    globals.css
  components/
  hooks/
  lib/
public/
samples/
```

## Reviewer tips
- Start on `/`, upload sample CSVs from `samples/`.
- Run validation and try “Auto Fix”.
- Add a rule via natural language (e.g., “Task A and Task B together”).
- Tweak priority weights or choose a preset.
- In Preview & Export, download cleaned CSVs/XLSX and `rules_config.json`.
