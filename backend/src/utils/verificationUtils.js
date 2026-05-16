/**
 * PayGuard AI - Document Verification Engine
 * 
 * This module performs deep analysis on extracted OCR text from bank statements 
 * and mobile app screenshots to verify identity and document legitimacy.
 */

function normText(s) {
    return (s || '').toString().replace(/\s+/g, ' ').trim();
}

function digitsOnly(s) {
    return (s || '').toString().replace(/\D/g, '');
}

/**
 * Fuzzy includes: checks if needle is within haystack with loose matching
 */
function includesLoose(haystack, needle) {
    const h = normText(haystack).toLowerCase();
    const n = normText(needle).toLowerCase();
    if (!h || !n) return false;
    // Remove special characters from both for better matching
    const cleanH = h.replace(/[^a-z0-9]/g, '');
    const cleanN = n.replace(/[^a-z0-9]/g, '');
    return cleanH.includes(cleanN);
}

/**
 * Extracts potential account numbers (10-digit NUBAN)
 */
function findAccountNumbers(text) {
    const t = (text || '').replace(/[\s-]/g, '');
    const matches = t.match(/\b\d{10}\b/g);
    return matches || [];
}

/**
 * Robust transaction extractor
 */
function extractTransactions(text, limit = 40) {
    const lines = (text || '').split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 10);
    const txs = [];

    // Date formats: DD/MM/YYYY, YYYY-MM-DD, Month DD, YYYY, etc.
    const dateRegex = /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|20\d{2}[-/]\d{1,2}[-/]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2})\b/i;
    // Amount formats: 1,000.00, 500.00, 1000, etc.
    const amountRegex = /(?:₦|NGN|GHS|USD|EUR)?\s?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/i;

    for (const line of lines) {
        const dateMatch = line.match(dateRegex);
        const amountMatch = line.match(amountRegex);

        if (dateMatch && amountMatch) {
            const amount = amountMatch[1].replace(/,/g, '');
            if (parseFloat(amount) > 0) {
                txs.push({
                    raw: line,
                    date: dateMatch[0],
                    amount: amount,
                    reference: extractReferenceId(line)
                });
            }
        }
        if (txs.length >= limit) break;
    }
    return txs;
}

function extractReferenceId(text) {
    const t = text || '';
    // Look for common reference labels
    const m = t.match(/\b(?:ref|txn|trans|id|session|rrn)[:#]?\s*([A-Z0-9\-_/]{8,})\b/i) ||
              t.match(/\b([A-Z0-9]{12,})\b/i); // Long strings of characters are likely IDs
    return m ? m[1] : null;
}

/**
 * Main AI analysis entry point
 */
function analyzeUploads({ worker, statement, screenshot }) {
    const evidence = [];
    let scoreDelta = 0;
    let hardFlag = false;

    const sText = statement?.text || '';
    const pText = screenshot?.text || '';

    // 1. Legitimacy Check: Keyword Density
    const bankingKeywords = ['balance', 'statement', 'transaction', 'debit', 'credit', 'account', 'transfer', 'ledger', 'available'];
    const sHits = bankingKeywords.filter(k => includesLoose(sText, k)).length;
    const pHits = bankingKeywords.filter(k => includesLoose(pText, k)).length;

    if (sHits >= 3) {
        scoreDelta += 5;
        evidence.push(`Statement legitimacy: High banking keyword density (${sHits} detected) (+5)`);
    } else {
        evidence.push('Statement legitimacy: Low keyword density - document structure unverified (0)');
    }

    if (pHits >= 2) {
        scoreDelta += 5;
        evidence.push(`Screenshot legitimacy: Banking app interface cues detected (+5)`);
    } else {
        evidence.push('Screenshot legitimacy: App interface cues missing (0)');
    }

    // 2. Identity Verification: Account Number
    const sAccts = findAccountNumbers(sText);
    const workerAcct = digitsOnly(worker?.account_number);
    const acctFoundInStatement = sAccts.some(a => a === workerAcct || a.includes(workerAcct) || workerAcct.includes(a));

    if (acctFoundInStatement) {
        scoreDelta += 5;
        evidence.push('Identity Sync: Account number found on bank statement (+5)');
    } else {
        evidence.push(`Identity Sync: Could not find account [${workerAcct}] on statement (0)`);
    }

    // 3. Identity Verification: Name Match
    const nameOnStatement = includesLoose(sText, worker?.full_name);
    if (nameOnStatement) {
        scoreDelta += 5;
        evidence.push('Identity Sync: Name found on bank statement (+5)');
    } else {
        evidence.push('Identity Sync: Name mismatch or not found on statement (0)');
    }

    // 4. Cross-Document Consistency: Overlapping Transactions
    const sTxs = extractTransactions(sText);
    const pTxs = extractTransactions(pText);

    let matchCount = 0;
    const matchedRefs = new Set();

    if (sTxs.length > 0 && pTxs.length > 0) {
        for (const st of sTxs) {
            for (const pt of pTxs) {
                // Matching criteria: Same amount (strictly) and similar date or reference
                const amountMatch = st.amount === pt.amount;
                const refMatch = (st.reference && pt.reference && st.reference === pt.reference);
                
                if (amountMatch && (refMatch || st.date === pt.date)) {
                    matchCount++;
                    if (st.reference) matchedRefs.add(st.reference);
                    break;
                }
            }
        }
    }

    if (matchCount >= 2) {
        scoreDelta += 10;
        evidence.push(`Consistency Check: Found ${matchCount} overlapping transactions between Statement and App (+10)`);
    } else if (matchCount === 1) {
        scoreDelta += 5;
        evidence.push('Consistency Check: Only 1 overlapping transaction found. High risk (+5)');
    } else {
        evidence.push('Consistency Check: ZERO overlapping transactions. Document legitimacy flagged.');
        hardFlag = true;
    }

    // 5. Generate Challenge
    // Prioritize a transaction that exists in both for the challenge
    const challengeSource = pTxs.length > 0 ? pTxs : sTxs;
    const challengeTx = challengeSource.find(t => t.reference) || challengeSource[0];

    const receiptChallenge = challengeTx ? {
        reference_id: challengeTx.reference || extractReferenceId(challengeTx.raw),
        amount: challengeTx.amount,
        date: challengeTx.date,
        hint: `To verify these documents, upload the digital receipt for the ${challengeTx.amount} transaction on ${challengeTx.date}.`
    } : null;

    if (!receiptChallenge?.reference_id) {
        evidence.push('Challenge Error: Could not extract a verifiable transaction ID. Manual review required.');
        hardFlag = true;
    }

    return {
        scoreDelta: Math.min(30, scoreDelta),
        hardFlag,
        evidence,
        receiptChallenge
    };
}

function verifyReceipt({ expected, receipt }) {
    const evidence = [];
    let scoreDelta = 0;
    let hardFlag = false;

    const text = normText(receipt?.text);
    if (!text || text.length < 50) {
        return { scoreDelta: 0, hardFlag: true, evidence: ['Receipt OCR failed: Image too blurry or insufficient text.'] };
    }

    const ref = expected?.reference_id;
    if (ref && includesLoose(text, ref)) {
        scoreDelta += 10;
        evidence.push('Receipt Verification: Reference ID matched (+10)');
    } else {
        evidence.push('Receipt Verification: Reference ID mismatch (Flagged)');
        hardFlag = true;
    }

    if (expected?.amount && text.includes(expected.amount.toString().replace(/,/g, ''))) {
        scoreDelta += 5;
        evidence.push('Receipt Verification: Amount matched (+5)');
    }

    return { scoreDelta, hardFlag, evidence };
}

function statusFromScore(score, hardFlag) {
    if (hardFlag) return 'flagged';
    if (score >= 80) return 'verified';
    if (score >= 50) return 'flagged';
    return 'rejected';
}

module.exports = {
    analyzeUploads,
    verifyReceipt,
    statusFromScore
};
