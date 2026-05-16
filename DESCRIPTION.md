# PayGuard AI: Anti-Ghost-Worker Fraud Prevention

## The Problem
Ghost worker fraud costs governments billions of Naira annually. Fraudsters insert fictitious employees into payrolls, siphoning salaries through unverified accounts. Traditional systems lack the real-time identity, financial history, and name-integrity verification needed to block these "ghosts" before money leaves the treasury.

## The PayGuard AI Solution
**PayGuard AI** is a specialized payroll gatekeeper that enforces a strict **"Verify Before Pay"** protocol using a 100-point trust engine and the **Squad API**.

### 1. High-Integrity Data Input
Department Admins upload monthly payroll files with separate **First Name** and **Last Name** columns. This enables the AI to perform precise name-matching checks and prevents "single-name" registration bypasses.

### 2. Trust-Based Onboarding
- **NIN Matching:** Workers cannot register unless their NIN exists in an authorized payroll batch.
- **Uniqueness Check:** The system automatically flags duplicate NINs, neutralizing ghost-worker rings attempting to collect multiple salaries.

### 3. Multi-Factor Trust Scoring
Worker legitimacy is measured through a dynamic trust score:
- **Identity (+25):** NIN and Account match official records.
- **Uniqueness (+25):** No duplicate NINs detected in the batch.
- **Integrity (+20):** Registered name matches the split-name payroll entry.
- **Documentation (+30):** Comparison of Bank Statement vs. App Screenshot.

### 4. Smart Decision Ledger & Appeals
Admins manage a real-time dashboard featuring:
- **AI Alerts Feed:** Real-time monitoring of risk findings and payment events.
- **Appeals Inbox:** A dedicated workspace where admins review worker explanations for discrepancies and manually verify legitimate cases.
- **Disbursement Gate:** A hard block on Squad transfers for any worker with a score below 80 or a "Flagged" status.

### 5. Squad Treasury Integration
- **Ledger Balance:** Real-time visibility of treasury funds.
- **Secure Funding:** Batch funding through Squad's encrypted checkout gateway.
- **Verified Disbursement:** Final salary payouts are released only after AI trust scores meet the verification threshold.

---

## Technical Pillars
- **Supabase:** Secure PostgreSQL database with RLS ensuring total data isolation between government departments.
- **Squad API:** Powering identity lookup, treasury management, and secure NIP transfers.
- **Risk Engine:** Custom backend logic that evaluates fraud signals and manages the worker-to-payroll matching lifecycle.
