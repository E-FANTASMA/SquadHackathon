# Payroll Verification & Anti-Ghost-Worker System Backend

This is the backend built with Node.js, Express, Supabase, and Squad API.

## Tech Stack
- **Node.js & Express.js**: Backend framework.
- **Supabase**: Authentication, PostgreSQL database, and File Storage.
- **Squad API**: Payment processing, wallet funding, and worker verification.
- **xlsx**: Excel file parsing for payroll uploads.

---

## Getting Started

### 1. Prerequisites
- Node.js installed.
- A Supabase account and project.
- A Squad API account (Sandbox or Live).

## API Endpoints

### Authentication
- `POST /api/auth/company/signup`: Register a new company.
- `POST /api/auth/worker/signup`: Register a new worker.
- `POST /api/auth/company/login`: Login for companies.
- `POST /api/auth/worker/login`: Login for workers.

### Company Actions (Require `company_admin` role)
- `POST /api/company/upload-payroll`: Upload Excel file with columns `full_name`, `nin`, `account_number`, `salary_amount`.
- `GET /api/company/payroll-batches`: View all uploaded batches.
- `GET /api/company/batch-workers/:batchId`: View workers in a specific batch.
- `POST /api/payment/fund-batch`: Initiate payment to fund a payroll batch via Squad.
- `POST /api/payment/disburse`: Trigger salary disbursement for verified workers.

### Worker Actions (Require `worker` role)
- `POST /api/worker/claim-record`: Claim a payroll record using NIN and account number.
- `POST /api/worker/upload-documents`: Upload bank statement and screenshot.
- `GET /api/worker/status`: View verification status and profile.

### Webhooks
- `POST /api/payment/webhook`: Squad webhook listener for payment confirmations.

---

## Important Notes
- **Verification Engine**: The logic for parsing statements and screenshots is handled separately. The `verification_status` in the `workers` and `payroll_workers` tables should be updated by the verification engine to `verified`, `flagged`, or `rejected`.
- **Security**: RLS policies are enabled on Supabase tables to ensure users can only access their own data.
- **Squad API**: Ensure you use the correct environment (Sandbox vs Live) and have funded your Squad test wallet for disbursements.
