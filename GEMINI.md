# GEMINI.md - Project Context & Instructions

## Project Overview
**Name:** Payroll Verification & Anti-Ghost-Worker System
**Type:** Full-stack Web Application (Backend-focused)
**Purpose:** A system designed to verify payroll records and prevent "ghost workers" by integrating biometric/identity verification (NIN) and secure payment processing.

### Key Technologies
- **Backend:** Node.js with Express.js
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage (for payroll files and worker documents)
- **Payment & Verification:** Squad API (Bank account verification, NIN verification, Payouts)
- **Excel Processing:** `xlsx` library for parsing payroll uploads

### Architecture
The project follows a modular Express architecture:
- `backend/server.js`: Server entry point.
- `backend/src/app.js`: Application setup, middleware, and route registration.
- `backend/src/routes/`: API endpoint definitions.
- `backend/src/controllers/`: Request handling and business logic.
- `backend/src/services/`: Integration with external services like Squad API.
- `backend/src/models/`: Database abstraction models for Transfers, Virtual Accounts, and Audit Logs.
- `backend/src/middleware/`: Authentication and role-based authorization logic.
- `backend/src/config/`: Configuration for Supabase and other services.

## PayGuard AI Integration (Squad API)
The system is integrated with the Squad API to provide:
- **Automated Disbursement:** Salary payments triggered only after AI approval.
- **Transaction Verification:** Real-time status checks for all transfers.
- **Audit System:** Comprehensive logging of all financial and administrative actions.

### Key Logic: AI-Controlled Payments
The `disburse` logic in `payrollController.js` enforces the core rule: **NO AI APPROVAL = NO PAYMENT**. Payments are only initiated if the worker's `verification_status` is marked as `verified`.

## Building and Running

### Prerequisites
- Node.js installed.
- Supabase project configured with `users`, `payroll_batches`, and `payroll_workers` tables.
- Squad API keys (Secret Key and Base URL).

### Environment Variables
Create a `.env` file in the `backend/` directory with the following variables:
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SQUAD_SECRET_KEY=your_squad_secret_key
SQUAD_BASE_URL=https://sandbox-api-d.squadco.com  # Use sandbox for development
```

### Key Commands
Run these commands from the `backend/` directory:
- **Install Dependencies:** `npm install`
- **Start Production:** `npm start`
- **Start Development (with Nodemon):** `npm run dev`
- **Test:** `npm test` (Note: Currently no tests specified in `package.json`)

## Development Conventions

### API Design
- Follows RESTful principles.
- Endpoints are prefixed with `/api`.
- Protected routes require an `Authorization: Bearer <token>` header using Supabase JWTs.

### Error Handling
- Controllers use `try-catch` blocks and return consistent JSON error responses: `{ error: "message" }`.

### Database Access
- Primarily uses `supabaseAdmin` for backend tasks to bypass RLS when necessary, while standard `supabase` client is used where user-level permissions apply.

### Contribution Guidelines
- Ensure any new tables or schema changes are documented in `backend/database/schema.sql`.
- Follow the existing module structure for new features (Route -> Controller -> Service).

## Key Files
- `backend/server.js`: Entry point for the Node server.
- `backend/src/app.js`: Express app configuration.
- `backend/src/services/squadService.js`: Core logic for interacting with Squad API.
- `backend/src/controllers/payrollController.js`: Logic for payroll uploads and worker management.
- `payment/hold.html`: A sample checkout page for testing Squad integration.
