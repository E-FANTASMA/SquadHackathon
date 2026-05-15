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
DISABLE_AUTH=true # Toggle to 'false' for production JWT verification

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Squad API
SQUAD_SECRET_KEY=your_squad_secret_key
SQUAD_BASE_URL=https://sandbox-api-d.squadco.com
SQUAD_MERCHANT_ID=SQ-PAYGUARD # Fallback merchant ID for references
```

## API Endpoints

### 1. Payroll & Funding (`/api/payroll`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/payroll/upload-payroll` | Upload master payroll Excel file. |
| GET | `/api/payroll/payroll-batches` | Get list of all payroll batches. |
| POST | `/api/payroll/initiate-funding` | Generate a Squad checkout URL to fund a batch. |
| POST | `/api/payroll/simulate-funding` | (Sandbox) Mock a successful payment into a batch. |
| POST | `/api/payroll/disburse` | **AI-Gated:** Pay verified workers via Squad Transfer. |
| GET | `/api/payroll/verify/:reference` | Verify transfer status with Squad. |

### 2. Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/auth/company/signup` | Signup for Government Ministry/Department. |
| POST | `/api/auth/worker/signup` | Signup for individual workers. |
| POST | `/api/auth/company/login` | Universal login (returns JWT). |

### 3. Worker Portal (`/api/worker`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/worker/claim-record` | Match bank details to an uploaded payroll entry. |
| POST | `/api/worker/upload-documents` | Upload ID proof for AI/Admin verification. |
| GET | `/api/worker/status` | Check verification and payment progress. |

## Core Logic: "NO AI APPROVAL = NO PAYMENT"
The disbursement logic in `controllers/payrollController.js` ensures that `squadService.disburseFunds` is only called if the worker's status is `verified`. Every step of the funding and disbursement process is recorded in the `audit_logs` table for full transparency.

## Testing
- Use the `SAMPLE_REQUESTS.md` file for example cURL commands.
- Use `000013` (GTBank) as the bank code for stable testing in the Squad sandbox.
