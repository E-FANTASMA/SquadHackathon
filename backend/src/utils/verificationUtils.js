function normText(s) {
  return (s || '').toString().replace(/\s+/g, ' ').trim();
}

function digitsOnly(s) {
  return (s || '').toString().replace(/\D/g, '');
}

function includesLoose(haystack, needle) {
  const h = normText(haystack).toLowerCase();
  const n = normText(needle).toLowerCase();
  if (!h || !n) return false;
  return h.includes(n);
}

function findAccountNumber(text) {
  // Heuristic: 10-digit NUBAN most likely.
  const t = (text || '').replace(/\s/g, '');
  const matches = t.match(/\b\d{10}\b/g);
  return matches && matches.length ? matches[0] : null;
}

function looksLikeTransactionList(text) {
  const t = (text || '').toLowerCase();
  const hasMoney = /₦|ngn|\bdebit\b|\bcredit\b/.test(t);
  const hasDate = /\b(20\d{2}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/](20)?\d{2})\b/.test(t);
  return hasMoney && hasDate;
}

function extractTransactions(text, limit = 25) {
  // Very rough parser: find lines that contain amount-ish + date-ish.
  const lines = (text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const txs = [];
  for (const line of lines) {
    if (!/\d/.test(line)) continue;
    const dateMatch = line.match(/\b(20\d{2}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/](20)?\d{2})\b/);
    const amountMatch = line.match(/(?:₦|NGN)?\s?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/i);
    if (!dateMatch || !amountMatch) continue;
    txs.push({
      raw: line,
      date: dateMatch[0],
      amount: amountMatch[1],
      reference_id: extractReferenceId(line)
    });
    if (txs.length >= limit) break;
  }
  return txs;
}

function extractReferenceId(text) {
  const t = text || '';
  // Common labels: Ref, Reference, Transaction ID, RRN, Session ID
  const m =
    t.match(/\b(?:ref(?:erence)?|transaction\s*id|rrn|session\s*id)[:#]?\s*([A-Za-z0-9\-_/]{6,})\b/i) ||
    t.match(/\b([A-Za-z0-9]{10,})\b/); // fallback: long-ish token
  return m ? m[1] : null;
}

function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function statusFromScore(score, hardFlag) {
  if (hardFlag) return 'flagged';
  if (score >= 80) return 'verified';
  if (score >= 50) return 'flagged';
  return 'rejected';
}

function analyzeUploads({ worker, statement, screenshot }) {
  const evidence = [];
  let scoreDelta = 0;
  let hardFlag = false;

  const statementText = normText(statement?.text);
  const screenshotText = normText(screenshot?.text);

  const statementWarnings = statement?.warnings || [];
  const screenshotWarnings = screenshot?.warnings || [];
  for (const w of statementWarnings) evidence.push(`Statement OCR warning: ${w}`);
  for (const w of screenshotWarnings) evidence.push(`Screenshot OCR warning: ${w}`);

  // Statement AI (+15)
  const statementLooksPlausible = statementText.length >= 200;
  const acctFromStatement = findAccountNumber(statementText);
  const workerAcct = digitsOnly(worker?.account_number);
  const acctMatches = acctFromStatement && workerAcct && acctFromStatement === workerAcct;
  const nameMatches = includesLoose(statementText, worker?.full_name);

  if (statementLooksPlausible) {
    scoreDelta += 7;
    evidence.push('Statement plausibility: Sufficient text extracted (+7)');
  } else {
    evidence.push('Statement plausibility: Too little text extracted (0)');
  }
  if (acctMatches) {
    scoreDelta += 5;
    evidence.push('Statement field match: Account number matches profile (+5)');
  } else if (acctFromStatement) {
    evidence.push(`Statement field match: Account number extracted but mismatch (${acctFromStatement}) (0)`);
    hardFlag = true;
  } else {
    evidence.push('Statement field match: Account number not detected (0)');
  }
  if (nameMatches) {
    scoreDelta += 3;
    evidence.push('Statement field match: Name appears on statement (+3)');
  } else {
    evidence.push('Statement field match: Name not detected (0)');
  }

  // Screenshot AI (+15)
  const screenshotPlausible = looksLikeTransactionList(screenshotText);
  if (screenshotPlausible) {
    scoreDelta += 10;
    evidence.push('Screenshot plausibility: Transaction history cues detected (+10)');
  } else {
    evidence.push('Screenshot plausibility: Could not detect transaction history cues (0)');
  }
  if (includesLoose(screenshotText, worker?.bank_name) || /transaction|history|debit|credit/i.test(screenshotText)) {
    scoreDelta += 5;
    evidence.push('Screenshot OCR: Banking keywords detected (+5)');
  } else {
    evidence.push('Screenshot OCR: Banking keywords missing (0)');
  }

  const statementTxs = extractTransactions(statementText, 25);
  const screenshotTxs = extractTransactions(screenshotText, 25);
  const allTxs = [...statementTxs];

  let overlapFound = false;
  if (statementTxs.length && screenshotTxs.length) {
    outer: for (const sTx of statementTxs) {
      for (const pTx of screenshotTxs) {
        if (!sTx.amount || !pTx.amount) continue;
        const sAmt = sTx.amount.replace(/,/g, '');
        const pAmt = pTx.amount.replace(/,/g, '');
        if (sAmt === pAmt && sTx.date && pTx.date) {
          overlapFound = true;
          break outer;
        }
      }
    }
  }

  if (overlapFound) {
    evidence.push('Cross-document consistency: Found at least 1 overlapping transaction (evidence)');
  } else {
    evidence.push('Cross-document consistency: No overlapping transaction found (evidence)');
    hardFlag = true;
  }

  const selected = pickRandom(allTxs.length ? allTxs : screenshotTxs);
  const receiptChallenge = selected
    ? {
        reference_id: selected.reference_id || extractReferenceId(selected.raw) || null,
        amount: selected.amount,
        date: selected.date,
        hint: 'Upload a receipt for the highlighted transaction. OCR must show the same reference/transaction ID.'
      }
    : null;

  if (!receiptChallenge || !receiptChallenge.reference_id) {
    evidence.push('Receipt challenge: Could not extract a reference ID; will require manual review');
    hardFlag = true;
  } else {
    evidence.push(`Receipt challenge: Selected transaction reference ${receiptChallenge.reference_id} (next step)`);
  }

  // Cap doc delta at 30.
  scoreDelta = Math.max(0, Math.min(30, scoreDelta));

  return {
    scoreDelta,
    hardFlag,
    evidence,
    receiptChallenge
  };
}

function verifyReceipt({ expected, receipt }) {
  const evidence = [];
  let scoreDelta = 0;
  let hardFlag = false;

  const receiptText = normText(receipt?.text);
  if (!receiptText || receiptText.length < 30) {
    evidence.push('Receipt OCR: Too little text extracted');
    return { scoreDelta: -10, hardFlag: true, evidence };
  }

  const ref = expected?.reference_id;
  if (ref && includesLoose(receiptText, ref)) {
    scoreDelta += 10;
    evidence.push('Receipt match: Reference ID found (+10)');
  } else {
    hardFlag = true;
    evidence.push('Receipt match: Reference ID not found (hard flag)');
  }

  if (expected?.amount) {
    const amt = expected.amount.toString().replace(/,/g, '');
    if (receiptText.replace(/,/g, '').includes(amt)) {
      scoreDelta += 5;
      evidence.push('Receipt match: Amount found (+5)');
    } else {
      evidence.push('Receipt match: Amount not found (0)');
    }
  }

  if (expected?.date && includesLoose(receiptText, expected.date)) {
    scoreDelta += 5;
    evidence.push('Receipt match: Date found (+5)');
  }

  return { scoreDelta, hardFlag, evidence };
}

module.exports = {
  analyzeUploads,
  verifyReceipt,
  statusFromScore
};

