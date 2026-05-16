# GEMINI.md - Project Context & Instructions

## Project Overview
**Name:** PayGuard AI (Payroll Verification & Anti-Ghost-Worker System)
**Type:** Full-stack Web Application
**Purpose:** A system designed to verify payroll records and prevent "ghost workers" by integrating identity verification (NIN), document AI verification (Bank Statements), and secure payment processing via Squad API.

### Key Technologies
- **Frontend:** React (TypeScript), Vite, TailwindCSS, Lucide Icons, Shadcn UI.
- **Backend:** Node.js with Express.js.
- **Database:** Supabase (PostgreSQL) with Row-Level Security (RLS).
- **Authentication:** Supabase Auth with custom Profile triggers.
- **File Storage:** Supabase Storage (for payroll excels, statements, and screenshots).
- **Payment & Verification:** Squad API (Balance retrieval, Bank verification, Payouts, Checkout).
- **Excel Processing:** `xlsx` library for parsing payroll uploads.

### Architecture
The project follows a modular Express architecture:
- `backend/server.js`: Server entry point.
- `backend/src/app.js`: Application setup and route registration.
- `backend/src/routes/`: API endpoint definitions (Auth, Payroll, Worker, Payment).
- `backend/src/controllers/`: Request handling and core business logic.
- `backend/src/services/`: Integration with external services like Squad API.
- `backend/src/middleware/`: JWT Authentication and role-based authorization.
- `backend/src/config/`: Configuration for Supabase and Squad clients.

## Key Logic & Workflows

### 1. Registration & Security
- **Strict Worker Signup:** Workers can only register if their **NIN and Name** match an existing payroll record uploaded by an employer. Access is denied if no matching record is found in the "Decision Ledger".
- **Role-Based Access:** Distinction between `company_admin` (Government Department) and `worker` (Employee).

### 2. Payroll Management
- **Ministry-Level Organization:** Each company account represents a distinct government department. No sub-department grouping is used.
- **Batch Processing:** Payroll is uploaded via Excel. Records default to a `pending` status.
- **Batch Cleanup:** Admins can delete older batches, which cascade-deletes associated worker records to maintain a clean workspace.

### 3. AI-Verified Disbursement (Squad API)
- **The Core Rule:** **NO AI APPROVAL = NO PAYMENT**.
- **Verification Flow:** Workers must upload a **Bank Statement** (PDF) and a **Bank App Screenshot** (showing 10+ transactions).
- **AI Analysis:** The system compares document data. If discrepancies are found, the record is `flagged` for Manual Admin Review.
- **Payouts:** Transfers are only initiated for workers with `verified` status.

### 4. Wallet & Funding
- **Live Balance:** Real-time retrieval of Squad Ledger Balance (in NGN) directly on the dashboard.
- **Secure Funding:** Batch funding uses Squad Checkout. Success is confirmed via a callback with an `amount` parameter to immediately update the available balance.

## Building and Running

### Environment Variables (.env)
```env
PORT=5000
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SQUAD_SECRET_KEY=...
SQUAD_BASE_URL=https://sandbox-api-d.squadco.com
SQUAD_MERCHANT_ID=...
FRONTEND_URL=http://localhost:8080
```

### Key Commands (Root)
- `npm run install-all`: Install both frontend and backend dependencies.
- `npm run dev`: Start both servers concurrently.

## Development Conventions
- **API Prefixes:** All backend endpoints are prefixed with `/api`.
- **Naming:** Backend uses `snake_case` for database fields; Frontend maps these to `camelCase` where appropriate.
- **Audit Logs:** All financial actions (funding, disbursement) and security actions (overrides) are logged in `public.audit_logs`.
