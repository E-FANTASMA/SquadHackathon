# PayGuard AI - Worker Trust Scoring System

This document outlines the multi-factor scoring system used to determine worker legitimacy and prevent ghost-worker fraud.

## Total Score: 100

| Weight | Criteria | Description |
| :--- | :--- | :--- |
| **+25** | **Identity Match** | NIN and Bank Account details match a record in the authoritative payroll batch. |
| **+25** | **Uniqueness** | The NIN is unique within the payroll batch (i.e., no other worker is using this NIN). |
| **+20** | **Name Integrity** | The name provided during registration matches the name on the payroll list. |
| **+15** | **Statement AI** | (Pending) Successful verification of the uploaded bank statement PDF. |
| **+15** | **App Screenshot** | (Pending) Successful verification of the transaction history screenshot. |

---

## Status Mapping

| Trust Score | Status | Description |
| :--- | :--- | :--- |
| **>= 80** | **Verified** | Cleared for automatic Squad disbursement. |
| **50 - 79** | **Flagged** | Discrepancies detected. Requires Manual Review or Appeal. |
| **< 50** | **Rejected** | High fraud risk. Disbursement blocked. |

---

## Hard Rules (Overrides)

1.  **Duplicate NIN Check**: If duplicate NINs are detected in a payroll batch, the status for ALL involved records is automatically set to **Flagged**, regardless of the total trust score.
2.  **Missing NIN**: If a worker's NIN does not match any record in the batch, the worker remains in **Pending** status and cannot claim a salary.
3.  **Appeals**: Workers with flagged or rejected status can submit an appeal. If an appeal is submitted, the record is moved to **Flagged** for Department Admin review.
