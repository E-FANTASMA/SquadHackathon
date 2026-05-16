# PayGuard AI Backend Integration

This is the backend for the PayGuard AI platform, built with Node.js, Express, Supabase, and Squad API.

## Tech Stack
- **Node.js & Express.js**: Backend framework.
- **Supabase**: Authentication, PostgreSQL database (RLS enabled), and File Storage.
- **Squad API**: Payouts, Checkout, Account Lookup, and Ledger Balance.
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

### 1. Administration (`/api/company`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/company/upload-payroll` | Upload Excel (Must have `first_name`, `last_name`). |
| GET | `/api/company/payroll-batches` | Get list of all department payroll batches. |
| GET | `/api/company/appeals` | Retrieve worker disputes for review. |
| POST | `/api/company/update-worker-status` | Manually override worker trust status. |
| DELETE | `/api/company/delete-batch/:id` | Cleanup batch and associated worker records. |
| POST | `/api/company/squad/disburse` | **AI-Gated:** Release salary to a verified worker. |
| POST | `/api/company/wallet/fund` | Treasury funding via Squad Checkout. |

### 2. Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/auth/company/signup` | Signup for Department (Split name validation). |
| POST | `/api/auth/worker/signup` | **NIN-Enforced:** Must match uploaded payroll. |
| POST | `/api/auth/company/login` | Returns JWT and comprehensive profile data. |

### 3. Worker Portal (`/api/worker`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/worker/claim-record` | **Scoring Engine:** NIN & Account fuzzy matching. |
| POST | `/api/worker/submit-documents` | Upload Statement (PDF) and Screenshot (Img). |
| POST | `/api/worker/submit-appeal` | File a dispute for flagged/rejected records. |

### 4. Infrastructure (`/api/payment`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/payment/balance` | Fetch live Squad merchant ledger balance. |
| POST | `/api/payment/webhook` | Squad event callback listener. |

## Core Logic: "Verify Before Pay"
The system ensures treasury safety by requiring workers to achieve a high **Trust Score** before any Squad transfer can be released. The engine automatically flags duplicate NINs as high-risk, forcing them into the manual review queue.

## Testing
- Use **GTBank (`058`)** for stable testing in the Squad sandbox.
- Ensure the Excel file contains separate `first_name` and `last_name` columns.
