# PayGuard AI: Anti-Ghost-Worker Fraud Prevention

## The Problem
Ghost worker fraud costs governments and large organizations billions of Naira annually. Fraudsters insert non-existent or ineligible employees into payrolls, siphoning salaries through unverified accounts. Traditional systems lack the real-time identity and financial history verification needed to block these "ghosts" before disbursement happens.

## The PayGuard AI Solution
**PayGuard AI** is a specialized payroll gatekeeper that bridges the gap between a department's payroll list and the worker's legitimate identity. It enforces a strict **"Verify Before Pay"** protocol using AI and the **Squad API**.

### 1. Authority-Led Data Input
A Government Department (Company Admin) uploads the authoritative monthly payroll Excel file. 
- **Master List:** This file contains the names, NINs, and salary amounts for every legitimate employee.
- **Initial Status:** All workers enter the **Smart Decision Ledger** with a `pending` status. No payments can be made at this stage.

### 2. Identity-First Worker Onboarding
Workers cannot simply join the platform. 
- **NIN Matching:** Registration is only permitted if the worker's National Identity Number (NIN) exists in an uploaded payroll batch.
- **Name Verification:** The system performs a loose name-match check between the registration data and the payroll record to prevent NIN hijacking.

### 3. Multi-Factor AI Verification
To move from `pending` to `verified`, a worker must prove their legitimacy:
- **Bank Statement Upload:** Workers upload a PDF of their bank statement.
- **Transaction History Screenshot:** Workers upload a screenshot from their mobile banking app showing at least 10 recent transactions.
- **AI Comparison:** PayGuard AI (simulated) compares the bank statement against the app screenshot and searches for previous salary credits. Discrepancies result in a `flagged` status, requiring manual review by the Department Admin.

### 4. Smart Decision Ledger & Admin Control
The Department Admin manages a real-time dashboard:
- **Alerts Feed:** A live feed of AI risk findings and Squad payment notifications.
- **Manual Review:** Admins can inspect uploaded documents for flagged workers and manually Verify, Reject, or keep them Flagged.
- **Execution Gate:** Only records marked as `verified` (by AI or Admin override) are eligible for the Squad disbursement gate.

### 5. Secure Funding & Disbursement (Squad API)
- **Treasury Funding:** Departments fund their payroll batches using the secure Squad Checkout gateway.
- **Ledger Balance:** The dashboard displays the live Squad Ledger Balance, ensuring treasury has sufficient funds.
- **Atomic Disbursement:** Verified salaries are paid out directly to workers' verified bank accounts using Squad's payout infrastructure.

---

## Technical Pillars
- **Supabase:** Secure PostgreSQL database with RLS ensuring data from one government department is never visible to another.
- **Squad API:** Handles NIN validation, bank account lookup, secure batch funding, and salary disbursement.
- **Smart Logic:** Custom logic gates that prevent disbursement if a worker is flagged or rejected, effectively neutralizing ghost workers in real-time.
