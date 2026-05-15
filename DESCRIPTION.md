# Payroll Verification & Anti-Ghost-Worker System

## Overview
The **Payroll Verification & Anti-Ghost-Worker System** is a robust solution designed to address the persistent challenge of "ghost workers" in corporate and governmental payroll systems. By integrating identity verification and automated payment processing, the system ensures that every person on a payroll is a legitimate, verified individual with a valid bank account and a government-recognized identity (NIN).

## The Problem
Ghost worker fraud occurs when non-existent or ineligible employees are added to a payroll, allowing fraudsters to siphon off salary payments. Traditional payroll systems often lack the real-time verification needed to ensure that the recipient of a payment is who they claim to be.

## Our Solution
This system creates a bridge between a company's payroll list and the worker's physical and digital identity. It uses a multi-layered verification process:
1.  **Company-Side Validation:** Admins upload authoritative payroll lists.
2.  **Worker-Side Claiming:** Workers must actively claim their records.
3.  **Identity Verification:** Integration with the **Squad API** allows for real-time verification of Bank Verification Numbers (BVN), National Identity Numbers (NIN), and bank account ownership.
4.  **Secure Disbursement:** Payments are only triggered for verified records, significantly reducing the risk of fraud.

---

## How It Works

### 1. Payroll Upload (Admin/Company)
A company administrator logs into the system and uploads an Excel file containing the monthly payroll.
- **Data required:** Full Name, NIN, Bank Account Number, and Salary Amount.
- **Process:** The system parses the Excel file, validates the data format, and stores the records as a "Pending Batch" in the Supabase database.

### 2. Worker Registration & Claiming
Individual workers sign up for the platform. To receive their salary, they must "claim" their specific record in an uploaded batch.
- **Claiming Process:** The worker provides their bank account number and bank code.
- **Internal Matching:** The system checks if this bank account and NIN match an entry in the "Pending Batch" uploaded by their employer.
- **NIN Verification:** The system uses the Squad API to verify that the provided NIN is valid and belongs to the user.

### 3. Document Verification (Optional/Advanced)
For additional security, workers can upload bank statements or screenshots as proof of identity, which can be reviewed by the company admin or an automated verification engine.

### 4. Admin Review
Company admins can view the status of all workers in a batch:
- **Pending:** Record uploaded but not yet claimed.
- **Verified:** Worker has claimed the record and identity checks have passed.
- **Flagged/Rejected:** Discrepancies found in NIN or bank details.

### 5. Funding and Disbursement
Once a batch is verified, the company funds the payroll:
- **Funding:** The company initiates a payment via Squad's payment gateway to fund the payroll batch.
- **Disbursement:** After funding is confirmed, the system can automatically disburse the exact salary amounts to the verified bank accounts of the workers.

---

## Technical Flow
1.  **Frontend (React/HTML):** Users interact with the interface to upload files or claim records.
2.  **Backend (Express):** Processes requests, handles Excel parsing, and manages the logic for matching workers to payroll records.
3.  **Database (Supabase):** Stores user profiles, payroll batches, and worker records with Row-Level Security (RLS) to ensure data privacy.
4.  **External Integration (Squad API):** Used for bank account verification, NIN verification, payment initiation, and the final payout processing.

## Security Features
- **JWT Authentication:** Secure login for both companies and workers.
- **Administrative Override:** Companies maintain final control over who gets paid.
- **Audit Logs:** Every action, from upload to payment, is tracked within the Supabase database.
