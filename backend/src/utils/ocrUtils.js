function safeRequire(name) {
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(name);
  } catch {
    return null;
  }
}

function bufferToDataUrl(buffer, mimeType) {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

async function extractTextFromPdfBuffer(pdfBuffer) {
  const pdfParse = safeRequire('pdf-parse');
  if (!pdfParse) {
    return {
      text: '',
      warnings: ['pdf-parse not installed; statement text extraction skipped']
    };
  }

  const parsed = await pdfParse(pdfBuffer);
  return {
    text: (parsed && parsed.text) || '',
    warnings: []
  };
}

async function ocrImageBuffer(imageBuffer, mimeType) {
  const tesseract = safeRequire('tesseract.js');
  if (!tesseract) {
    return {
      text: '',
      warnings: ['tesseract.js not installed; image OCR skipped']
    };
  }

  const dataUrl = bufferToDataUrl(imageBuffer, mimeType || 'image/png');
  const result = await tesseract.recognize(dataUrl, 'eng', {
    logger: () => {}
  });

  return {
    text: (result && result.data && result.data.text) || '',
    warnings: []
  };
}

async function extractStatement(file) {
  const isPdf = (file.mimetype || '').toLowerCase().includes('pdf');
  if (!isPdf) {
    // Some banks export statement screenshots; treat as image OCR.
    const img = await ocrImageBuffer(file.buffer, file.mimetype);
    return { kind: 'statement_image', ...img };
  }

  const parsed = await extractTextFromPdfBuffer(file.buffer);
  return { kind: 'statement_pdf', ...parsed };
}

async function extractScreenshot(file) {
  const parsed = await ocrImageBuffer(file.buffer, file.mimetype);
  return { kind: 'app_screenshot', ...parsed };
}

async function extractReceipt(file) {
  const parsed = await ocrImageBuffer(file.buffer, file.mimetype);
  return { kind: 'receipt', ...parsed };
}

module.exports = {
  extractStatement,
  extractScreenshot,
  extractReceipt
};

