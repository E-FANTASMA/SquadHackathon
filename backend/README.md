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

## API Endpoints & Testing Guide

### Authentication Flow
1. **Company Signup**: `POST /api/auth/company/signup`
   - Body: `{ "company_name", "email", "password", "phone_number" }`
2. **Worker Signup**: `POST /api/auth/worker/signup`
   - Body: `{ "full_name", "nin", "email", "password", "phone_number" }`
3. **Login**: `POST /api/auth/company/login` (Universal)
   - Action: Copy the `access_token` from the response.

### Headers for Protected Routes
All protected routes require an Authorization header:
`Authorization: Bearer <your_access_token>`

### Company Actions (Admin)
- **Upload Payroll**: `POST /api/company/upload-payroll`
  - Body (form-data): `batch_name` (text), `payroll_file` (file)
  - Excel Columns: `full_name`, `nin`, `account_number`, `salary_amount`
- **View Batches**: `GET /api/company/payroll-batches`
- **View Workers in Batch**: `GET /api/company/batch-workers/:batchId`
- **Update Worker Status**: `POST /api/company/update-worker-status`
  - Body: `{ "workerRecordId", "status" }` (status: `verified`, `rejected`, `flagged`)
- **Fund Batch**: `POST /api/payment/fund-batch`
  - Body: `{ "batchId" }`
  - Returns a Squad checkout URL.

### Worker Actions
- **Claim Record**: `POST /api/worker/claim-record`
  - Body: `{ "account_number", "bank_code", "bank_name" }`
  - *Must match NIN and Account Number in an uploaded payroll.*
- **Upload Documents**: `POST /api/worker/upload-documents`
  - Body (form-data): `statement` (file), `screenshot` (file)
- **Check Status**: `GET /api/worker/status`

### Simulating Payments (Webhook)
To simulate a successful payment in development:
- `POST /api/payment/webhook`
- Body: `{ "event": "charge.success", "metadata": { "batch_id": "UUID_HERE" } }`

---

## Important Notes
- **Verification Engine**: The logic for parsing statements and screenshots is handled separately. The `verification_status` in the `workers` and `payroll_workers` tables should be updated by the verification engine to `verified`, `flagged`, or `rejected`.
- **Security**: RLS policies are enabled on Supabase tables to ensure users can only access their own data.
- **Squad API**: Ensure you use the correct environment (Sandbox vs Live) and have funded your Squad test wallet for disbursements.
