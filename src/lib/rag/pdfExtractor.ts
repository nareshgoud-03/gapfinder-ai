/**
 * Robust PDF text extractor — works on Vercel serverless and local dev.
 * Uses pdf-parse v1 (proven stable) + pdfjs-dist fallback + regex fallback.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Strategy 1: pdf-parse v1.1.1 — the proven stable approach
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const fn = typeof pdfParse === 'function'
      ? pdfParse
      : typeof pdfParse.default === 'function'
      ? pdfParse.default
      : null;

    if (fn) {
      const result = await fn(buffer);
      const text = (result.text || '').trim();
      if (text && text.length > 20 && !text.startsWith('%PDF-')) {
        console.log(`pdf-parse v1 extracted ${text.length} chars`);
        return text;
      }
    }
  } catch (err) {
    console.warn('pdf-parse v1 failed:', err);
  }

  // Strategy 2: pdfjs-dist (Mozilla PDF.js) — pure JS, great for compressed PDFs
  try {
    const text = await extractWithPdfjs(buffer);
    if (text && text.trim().length > 20) {
      console.log(`pdfjs-dist extracted ${text.trim().length} chars`);
      return text.trim();
    }
  } catch (err) {
    console.warn('pdfjs-dist failed:', err);
  }

  // Strategy 3: Pure regex fallback — no native deps
  try {
    const text = extractTextViaRegex(buffer);
    if (text && text.length > 20) {
      console.log(`regex fallback extracted ${text.length} chars`);
      return text;
    }
  } catch {
    // give up
  }

  return '';
}

/**
 * Extract text from PDF using pdfjs-dist (Mozilla PDF.js).
 */
async function extractWithPdfjs(buffer: Buffer): Promise<string> {
  // Try multiple possible import paths for pdfjs-dist
  let pdfjsLib: any = null;

  const importPaths = [
    'pdfjs-dist/legacy/build/pdf.js',
    'pdfjs-dist/build/pdf.js',
    'pdfjs-dist',
  ];

  for (const path of importPaths) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      pdfjsLib = require(path);
      if (pdfjsLib && pdfjsLib.getDocument) break;
      if (pdfjsLib?.default?.getDocument) {
        pdfjsLib = pdfjsLib.default;
        break;
      }
    } catch {
      // try next path
    }
  }

  if (!pdfjsLib || !pdfjsLib.getDocument) {
    throw new Error('pdfjs-dist not found');
  }

  // Disable worker (not needed in Node.js)
  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
  }

  const uint8Array = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array, verbosity: 0 });
  const pdf = await loadingTask.promise;

  const pageTexts: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    if (pageText.trim()) pageTexts.push(pageText.trim());
  }

  return pageTexts.join('\n\n');
}

/**
 * Fallback pure-JS PDF text extractor using regex on raw binary content.
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
        .replace(/\\n/g, '\n').replace(/\\r/g, '')
        .replace(/\\t/g, ' ').replace(/\\\\/g, '\\')
        .replace(/\\\(/g, '(').replace(/\\\)/g, ')').trim();
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
