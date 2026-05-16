# PayGuard AI - Payroll Fraud Prevention Platform

## Overview
**PayGuard AI** is an AI-powered payroll fraud prevention platform designed to eliminate "ghost workers" from government and corporate payrolls. It serves as a secure bridge between treasury funding and final employee disbursement.

The system utilizes a multi-factor **Trust Scoring Engine** and the **Squad API** to ensure that only legitimate, verified workers receive payments.

## Core Features
- **NIN-Enforced Onboarding:** Strict registration logic that matches workers against authorized payroll master lists.
- **Multi-Factor Trust Scoring:** Dynamic scoring based on identity matching, record uniqueness, and name integrity.
- **AI-Verified Disbursement:** "Verify Before Pay" protocol requiring bank statement and transaction history comparison.
- **Appeals Resolution Inbox:** Integrated workspace for admins to review and resolve worker discrepancies.
- **Squad Wallet Integration:** Live ledger balance tracking and secure batch funding via Squad Checkout gateway.
- **Smart Decision Ledger:** Real-time audit dashboard with AI risk flags and automated payment gates.

## Project Structure
- `backend/`: Node.js/Express API with integrated Squad and Supabase logic.
- `frontend/`: React/TypeScript SPA with dynamic decision ledger and worker portal.
- `DESCRIPTION.md`: Detailed vision of the problem-solution fit.
- `GEMINI.md`: Full technical implementation guide and architectural rules.
- `ScoreSystem.md`: Documentation of the 100-point trust scoring logic.
- `SAMPLE_REQUESTS.md`: API documentation for Squad and verification endpoints.

## Quick Start
1.  **Dependencies:** Run `npm run install-all` from the root directory.
2.  **Environment:** Configure `.env` in `backend/` (refer to `GEMINI.md`).
3.  **Database:** Run `backend/database/production_schema.sql` and `APPEALS_SQL_UPDATE.txt` in your Supabase SQL Editor.
4.  **Run:** Execute `npm run dev` to start the frontend (8080) and backend (5000).

## Tech Stack
- **Frontend:** React, TailwindCSS, Shadcn UI, Zustand, TanStack Table.
- **Backend:** Node.js, Express, Multer, XLSX.
- **Infrastructure:** Supabase (Auth, DB, Storage).
- **Fintech:** Squad API (Payouts, Checkout, Verify, Balance).
