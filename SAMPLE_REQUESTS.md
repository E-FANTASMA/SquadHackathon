# PayGuard AI - Squad & Verification API Samples

This document provides sample requests for the Squad-integrated payroll, worker verification, and appeals endpoints.

## 1. Merchant Balance Retrieval
**Endpoint:** `GET /api/payment/balance`  
**Description:** Fetches the live NGN ledger balance for the department from Squad.

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

---

## 2. Worker Registration (Split Name)
**Endpoint:** `POST /api/auth/worker/signup`  
**Description:** Registers a worker with mandatory first and last name validation.

**Request Body:**
```json
{
  "firstName": "Chinedu",
  "lastName": "Okafor",
  "email": "worker@email.com",
  "password": "...",
  "nin": "12345678901"
}
```

---

## 3. Worker Claim (Fuzzy Matching)
**Endpoint:** `POST /api/worker/claim-record`  
**Description:** Matches bank details to a payroll entry with leading-zero resiliency.

**Request Body:**
```json
{
  "nin": "12345678901",
  "account_number": "0123456789",
  "bank_code": "058",
  "bank_name": "GTBank"
}
```

---

## 4. Appeal Submission
**Endpoint:** `POST /api/worker/submit-appeal`  
**Description:** Allows a flagged worker to submit an explanation to the admin.

**Request Body:**
```json
{
  "reason": "My NIN name was recently updated after marriage...",
  "payroll_worker_id": "BATCH_WORKER_UUID"
}
```

---

## 5. Appeals Retrieval (Admin)
**Endpoint:** `GET /api/company/appeals`  
**Description:** Fetches all pending and resolved appeals for the department.

---

## 6. Manual Status Override (Admin)
**Endpoint:** `POST /api/company/update-worker-status`  
**Description:** Manually Verify or Reject a worker after reviewing their documents/appeal.

**Request Body:**
```json
{
  "workerRecordId": "BATCH_WORKER_UUID",
  "status": "verified"
}
```

---

## 7. Disburse Salary (AI-Gated)
**Endpoint:** `POST /api/company/squad/disburse`  
**Description:** Triggers a Squad payout ONLY if trust score >= 80 and status is 'verified'.

---

## Headers (Required for all)
`Authorization: Bearer <JWT_TOKEN>`  
`Content-Type: application/json`
