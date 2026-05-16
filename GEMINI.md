# GEMINI.md - Project Context & Instructions

## Project Overview
**Name:** PayGuard AI (Payroll Verification & Anti-Ghost-Worker System)
**Type:** Full-stack Web Application
**Purpose:** A system designed to verify payroll records and prevent "ghost workers" using a multi-factor trust scoring engine, document AI (Bank Statements), and secure Squad API integration.

### Key Technologies
- **Frontend:** React (TypeScript), Vite, TailwindCSS, Shadcn UI, TanStack Table.
- **Backend:** Node.js with Express.js.
- **Database:** Supabase (PostgreSQL) with Row-Level Security (RLS).
- **Authentication:** Supabase Auth with custom Profile triggers.
- **File Storage:** Supabase Storage (payroll excels, statements, and screenshots).
- **Payment & Verification:** Squad API (Balance retrieval, Bank verification, Payouts, Checkout).
- **Excel Processing:** `xlsx` library for parsing multi-column payroll uploads.

---

## Technical Architecture & Workflows

### 1. Registration & Identity Integrity
- **Split Name Validation:** Registration requires separate `firstName` and `lastName` fields.
- **Strict Worker Signup:** Registration is only permitted if the provided **NIN and Name** match an existing payroll record.
- **Role-Based Access:** Distinct portals for `company_admin` (Government Department) and `worker`.

### 2. Payroll Batch Management
- **Excel Requirements:** Uploads must contain `first_name`, `last_name`, `nin`, `account_number`, and `salary_amount`.
- **Cleanup:** Admins can delete historical batches, which cascade-deletes associated worker records.

### 3. Trust Scoring Engine (ScoreSystem.md)
The system calculates a Trust Score (0-100) to gate Squad disbursements:
- **+25 (Identity Match):** NIN and Account match a payroll entry.
- **+25 (Uniqueness):** NIN appears only once in the payroll batch.
- **+20 (Name Integrity):** Registered name matches payroll name.
- **+30 (Document AI):** Comparison of Bank Statement vs. App Screenshot (in-progress).
- **Hard Rule:** Duplicate NINs automatically flag a worker as high-risk, regardless of score.

### 4. Appeals & Resolution
- **Worker Flow:** Flagged or Rejected workers can submit a formal appeal with a reason and supporting documentation.
- **Admin Flow:** The "Appeals Inbox" allows auditors to review worker explanations and manually override statuses to `verified`.

### 5. Squad Integration
- **Treasury Wallet:** Live retrieval of Squad Ledger Balance.
- **Funding:** Secure batch funding via Squad Checkout with automatic balance updates via callback parameters.
- **Disbursement:** Atomic transfers to verified bank accounts. **NO AI APPROVAL = NO PAYMENT**.

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
