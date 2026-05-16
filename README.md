# PayGuard AI - Payroll Fraud Prevention Platform

## Overview
**PayGuard AI** is an AI-powered payroll fraud prevention platform designed for government payroll systems. It ensures that treasury funds are only disbursed to legitimate, verified workers by creating a strict verification gate between payroll lists and final bank transfers.

The system utilizes the **Squad API** for banking infrastructure and **Supabase** for secure database management and identity services.

## Core Features
- **NIN-Enforced Onboarding:** Workers must match an existing payroll record (NIN & Name) to join the platform.
- **AI-Verified Disbursement:** "Verify Before Pay" protocol requiring bank statement and transaction screenshot comparison.
- **Smart Decision Ledger:** A real-time audit dashboard for department admins to review worker legitimacy and AI risk flags.
- **Squad Wallet Integration:** Live ledger balance tracking and secure batch funding via Squad Checkout.
- **Real-time Alerts Feed:** Monitoring system for AI risk analysis findings and payment gateway events.

## Project Structure
- `backend/`: Node.js/Express API with integrated Squad and Supabase logic.
- `frontend/`: React/TypeScript SPA with dynamic decision ledger and worker portal.
- `DESCRIPTION.md`: In-depth product vision and problem-solution fit.
- `GEMINI.md`: Full technical implementation guide and architectural rules.
- `SAMPLE_REQUESTS.md`: API documentation for Squad and worker verification endpoints.

## Quick Start
1.  **Dependencies:** Run `npm run install-all` from the root directory.
2.  **Environment:** Configure `.env` in `backend/` (refer to `GEMINI.md`).
3.  **Run:** Execute `npm run dev` to start the frontend (8080) and backend (5000).

## Tech Stack
- **Frontend:** React, TailwindCSS, Shadcn UI, Zustand, TanStack Table.
- **Backend:** Node.js, Express, Axios, Multer (for document uploads), XLSX.
- **Platform:** Supabase (Auth, DB, Storage).
- **Fintech:** Squad API (Payouts, Checkout, Verify).
