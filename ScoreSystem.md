# PayGuard AI - Worker Trust Scoring System

This document outlines the multi-factor scoring system used to determine worker legitimacy and prevent ghost-worker fraud.

## Total Score: 100

| Weight | Criteria | Description |
| :--- | :--- | :--- |
| **+25** | **Identity Match** | NIN and Bank Account details match a record in the authoritative payroll batch. |
| **+25** | **Uniqueness** | The NIN is unique within the payroll batch (i.e., no other worker is using this NIN). |
| **+20** | **Name Integrity** | The name provided during registration matches the name on the payroll list. |
| **+15** | **Statement AI** | OCR/text extraction validates key fields (account number/name), plausible statement structure, and flags obvious tampering. |
| **+15** | **App Screenshot** | OCR validates the bank app UI cues + extracts a transaction list consistent with the statement. |

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

---

## Additional AI Checks (Appended)

These checks do not change the 100-point total; they are used as evidence and as sub-signals inside the two 15-point document checks.

- **Statement Field Match**: Extracted `account_number` and/or `account_name` should match the worker profile within a tolerance.
- **Screenshot Plausibility**: Detects common UI cues (currency symbols, “Transactions/History”, date patterns) and extracts multiple transaction rows.
- **Cross-Document Consistency**: At least 1 transaction (amount + date/description) should appear in both the statement and screenshot.
- **Receipt Challenge (Post-Upload)**: System selects a random extracted transaction and requests a receipt; receipt OCR must contain the same reference/transaction ID and matching amount/date.
