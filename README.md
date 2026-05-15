# PayGuard AI - Payroll Fraud Prevention Platform

## Overview
**PayGuard AI** is an AI-powered payroll fraud prevention platform designed for government payroll systems. It serves as a secure bridge between treasury funding and employee disbursement, ensuring that only verified, legitimate workers receive salary payments.

The system integrates the **Squad API** for financial infrastructure and **Supabase** for secure data management and authentication.

## Core Features
- **AI-Controlled Disbursement:** Strictly enforces the rule: **NO AI APPROVAL = NO PAYMENT**.
- **Squad Virtual Accounts:** Dedicated funding accounts for ministries and agencies.
- **Secure Funding Flow:** Ministries fund payroll batches via secure checkout modals.
- **Automated Payouts:** Direct-to-bank salary transfers for verified workers.
- **Audit Trail:** Immutable logging of every administrative and financial action.

## Project Structure
- `backend/`: Node.js/Express API handling business logic and Squad integration.
- `payment/`: Sample frontend implementation for Squad payment testing.
- `GEMINI.md`: Technical context and project instructions.
- `DESCRIPTION.md`: Detailed conceptual overview of the project.
- `SAMPLE_REQUESTS.md`: Comprehensive API request examples.

## Quick Start
1. Navigate to the `backend/` directory.
2. Install dependencies: `npm install`.
3. Configure your `.env` file (refer to `backend/README.md`).
4. Run the development server: `npm run dev`.

## Documentation
- **API Endpoints:** See `backend/README.md`.
- **Logic & Architecture:** See `GEMINI.md`.
- **Product Overview:** See `DESCRIPTION.md`.
