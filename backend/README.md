# PayGuard AI Backend Integration

This is the backend for the PayGuard AI platform, built with Node.js, Express, Supabase, and Squad API.

## Tech Stack
- **Node.js & Express.js**: Backend framework.
- **Supabase**: Authentication, PostgreSQL database (RLS enabled), and File Storage.
- **Squad API**: Payment initiation, account lookup, and salary disbursement.
- **xlsx**: Excel file parsing for payroll uploads.

## Environment Variables
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
DISABLE_AUTH=false

# Supabase
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Squad API
SQUAD_SECRET_KEY=...
SQUAD_BASE_URL=https://sandbox-api-d.squadco.com
SQUAD_MERCHANT_ID=SQ-PAYGUARD
FRONTEND_URL=http://localhost:8080
```

## API Endpoints

### 1. Company / Payroll Administration (`/api/company`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/company/upload-payroll` | Upload master payroll Excel file. |
| GET | `/api/company/payroll-batches` | Get list of all payroll batches. |
| GET | `/api/company/batch-workers/:id` | Get individual worker records for a batch. |
| POST | `/api/company/update-worker-status` | Manually Verify/Reject a flagged worker. |
| DELETE | `/api/company/delete-batch/:id` | Remove batch and its worker records. |
| POST | `/api/company/squad/disburse` | **AI-Gated:** Release Squad payout to a verified worker. |
| POST | `/api/company/wallet/fund` | Initiate treasury wallet funding via Squad Checkout. |

### 2. Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/auth/company/signup` | Signup for Government Ministry/Department. |
| POST | `/api/auth/worker/signup` | **NIN-Enforced:** Signup for workers (must match payroll). |
| POST | `/api/auth/company/login` | Universal login (returns JWT and profile data). |

### 3. Worker Portal (`/api/worker`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/worker/claim-record` | Match bank account to an uploaded payroll entry. |
| POST | `/api/worker/submit-documents` | Upload Statement (PDF) and App Screenshot (Img). |
| GET | `/api/worker/status` | Check AI trust score and verification status. |

### 4. Squad Infrastructure (`/api/payment`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/payment/balance` | Fetch live Squad merchant ledger balance. |
| POST | `/api/payment/webhook` | Public endpoint for Squad event notifications. |

## Core Logic: "Verify Before Pay"
The system ensures treasury safety by requiring workers to be in `verified` status before any Squad transfer can be released. Discrepancies between payroll data and worker-submitted documents (Statement vs App Screenshot) trigger a `flagged` status, locking the disbursement until a manual audit is performed.

## Testing
- UseGTBank (`058`) as the bank code for stable testing in the Squad sandbox.
- Ensure NIN used during worker signup exists in the uploaded Excel master list.
