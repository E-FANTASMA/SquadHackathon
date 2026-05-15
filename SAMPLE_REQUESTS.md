# PayGuard AI - Squad Integration API Samples

This document provides sample requests for the new Squad-integrated payroll endpoints.

## 1. Initiate Funding for a Batch
**Endpoint:** `POST /api/payroll/initiate-funding`  
**Description:** Generates a checkout URL for a ministry to pay for a specific payroll batch.

**Request Body:**
```json
{
  "batchId": "YOUR_BATCH_UUID",
  "email": "finance@ministry.gov.ng"
}
```

**Response:**
```json
{
  "message": "Funding initiated. Please complete payment using the checkout URL.",
  "checkout_url": "https://sandbox-pay.squadco.com/FUND-...",
  "transaction_ref": "FUND-..."
}
```

---

## 3. Simulate Funding (Sandbox Demo)
**Endpoint:** `POST /api/payroll/simulate-funding`  
**Description:** Mocks a successful payment into the dynamic virtual account created by the checkout modal.

**Request Body:**
```json
{
  "virtual_account_number": "9279755518",
  "amount": 150000,
  "batchId": "YOUR_BATCH_UUID"
}
```

---

## 4. Disburse Salary (AI-Approved Only)
**Endpoint:** `POST /api/payroll/disburse`  
**Description:** Triggers a salary payment to a worker ONLY if they have been approved by the AI risk engine.

**Request Body:**
```json
{
  "workerRecordId": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
  "bank_code": "058"
}
```

**Response (Success):**
```json
{
  "message": "Disbursement initiated successfully",
  "transfer": {
    "transfer_reference": "PYG-abcd-1234-...",
    "status": "success",
    "amount": 150000.00
  }
}
```

**Response (Blocked by AI):**
```json
{
  "error": "Payment blocked: Worker has not been approved by the AI risk engine."
}
```

---

## 3. Verify Transfer
**Endpoint:** `GET /api/payroll/verify/:reference`  
**Description:** Verifies the status of a specific disbursement with Squad and updates the audit trail.

**URL Example:** `/api/payroll/verify/PYG-abcd-1234-...`

---

## Headers (Required for all)
`Authorization: Bearer <JWT_TOKEN>`  
`Content-Type: application/json`

## Audit Trail Events Logged
- `VIRTUAL_ACCOUNT_CREATED`
- `PAYMENT_BLOCKED`
- `TRANSFER_SUCCESS`
- `TRANSFER_FAILED`
- `TRANSFER_VERIFIED`
