# PayGuard AI - Squad Integration API Samples

This document provides sample requests for the Squad-integrated payroll and worker endpoints.

## 1. Merchant Balance Retrieval
**Endpoint:** `GET /api/payment/balance`  
**Description:** Fetches the live NGN ledger balance for the merchant from Squad.

**Response:**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "balance": 50000000,
    "currency": "NGN"
  }
}
```
*(Note: Balance is returned in Kobo)*

---

## 2. Wallet Funding (Direct)
**Endpoint:** `POST /api/company/wallet/fund`  
**Description:** Initiates a wallet funding transaction via Squad Checkout.

**Request Body:**
```json
{
  "amount": 500000,
  "email": "finance@ministry.gov.ng"
}
```

**Response:**
```json
{
  "ok": true,
  "checkout_url": "https://sandbox-pay.squadco.com/FUND-...",
  "transaction_ref": "REF_RANDOM_MERCHANTID"
}
```

---

## 3. Worker Verification (Document Upload)
**Endpoint:** `POST /api/worker/submit-documents`  
**Description:** Allows a worker to upload their bank statement and transaction screenshot for AI comparison.

**Request:** `multipart/form-data`
- `statement`: (PDF File)
- `screenshot`: (Image File)

**Response:**
```json
{
  "message": "Documents uploaded successfully. AI is comparing transactions. Status: Flagged for Admin Review.",
  "verification_status": "flagged"
}
```

---

## 4. Manual Status Override (Admin)
**Endpoint:** `POST /api/company/update-worker-status`  
**Description:** Allows an admin to manually set a worker's status after document review.

**Request Body:**
```json
{
  "workerRecordId": "BATCH_WORKER_UUID",
  "status": "verified"
}
```

---

## 5. Disburse Salary (AI-Approved Only)
**Endpoint:** `POST /api/company/squad/disburse`  
**Description:** Triggers a salary payment ONLY if verification_status is 'verified'.

**Request Body:**
```json
{
  "employeeId": "BATCH_WORKER_UUID"
}
```

---

## 6. Delete Payroll Batch
**Endpoint:** `DELETE /api/company/delete-batch/:batchId`  
**Description:** Deletes a payroll batch and all associated worker records.

---

## Headers (Required for all)
`Authorization: Bearer <JWT_TOKEN>`  
`Content-Type: application/json` (except for file uploads)
