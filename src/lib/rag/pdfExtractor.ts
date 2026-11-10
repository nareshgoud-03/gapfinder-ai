/**
 * Robust PDF text extractor using pdfjs-dist (Mozilla PDF.js) as primary.
 * Falls back to pdf-parse and finally regex extraction.
 * Works in Node.js, Vercel serverless, and edge environments.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Strategy 1: pdfjs-dist (Mozilla PDF.js) — pure JS, works on all serverless platforms
  try {
    const text = await extractWithPdfjs(buffer);
    if (text && text.trim().length > 20) {
      return text.trim();
    }
  } catch (err) {
    console.warn('pdfjs-dist extraction failed:', err);
  }

  // Strategy 2: pdf-parse v2 (PDFParse class)
  try {
    const pdfModule = await import('pdf-parse') as any;
    if (pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: buffer });
      const res = await parser.getText();
      let text = '';
      if (res && typeof res.text === 'string') {
        text = res.text.trim();
      } else if (res && Array.isArray(res.pages)) {
        text = res.pages.map((p: any) => p.text || '').join('\n\n').trim();
      }
      if (text && text.length > 20 && !text.startsWith('%PDF-')) {
        return text;
      }
    }
  } catch {
    // fall through
  }

  // Strategy 3: pdf-parse v1 (default export as function)
  try {
    const pdfModule = await import('pdf-parse') as any;
    const pdfFn = typeof pdfModule === 'function'
      ? pdfModule
      : typeof pdfModule.default === 'function'
      ? pdfModule.default
      : null;
    if (pdfFn) {
      const res = await pdfFn(buffer);
      const text = (res.text || '').trim();
      if (text && text.length > 20 && !text.startsWith('%PDF-')) {
        return text;
      }
    }
  } catch {
    // fall through
  }

  // Strategy 4: Pure regex fallback
  try {
    return extractTextViaRegex(buffer);
  } catch {
    return '';
  }
}

/**
 * Extract text from PDF using pdfjs-dist (Mozilla PDF.js).
 * This is a pure JavaScript PDF parser — no native binaries needed.
 */
async function extractWithPdfjs(buffer: Buffer): Promise<string> {
  // Use legacy build to avoid canvas/DOM requirements in Node
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs' as any) as any;

  // Disable worker for Node.js serverless environments
  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
  }

  const uint8Array = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data: uint8Array,
    // Suppress password-protected PDF errors gracefully
    verbosity: 0,
  });

  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    if (pageText.trim()) {
      pageTexts.push(pageText.trim());
    }
  }

  return pageTexts.join('\n\n');
}

/**
 * Fallback pure-JS PDF text extractor using regex on raw binary content.
 * Works without any native dependencies but handles fewer PDF formats.
 */
function extractTextViaRegex(buffer: Buffer): string {
  const content = buffer.toString('latin1');
  const lines: string[] = [];

  const btBlocks = content.match(/BT[\s\S]*?ET/g) || [];

  for (const block of btBlocks) {
    const tjMatches = block.match(/\(([^)]*)\)\s*T[jJ]/g) || [];
    for (const m of tjMatches) {
      const inner = m.replace(/^\(/, '').replace(/\)\s*T[jJ]$/, '');
      const cleaned = inner
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\t/g, ' ')
        .replace(/\\\\/g, '\\')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .trim();
      if (cleaned.length > 0) lines.push(cleaned);
    }

    const arrayMatches = block.match(/\[([^\]]*)\]\s*TJ/g) || [];
    for (const arr of arrayMatches) {
      const parts = arr.match(/\(([^)]*)\)/g) || [];
      const combined = parts.map((p) => p.slice(1, -1)).join('').trim();
      if (combined.length > 0) lines.push(combined);
    }
  }

  return lines.join(' ').replace(/\s+/g, ' ').trim();
}
