/**
 * Robust PDF text extractor that works in both local dev and Vercel serverless.
 * Uses multiple strategies in order of preference.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Strategy 1: Try pdf-parse v2 (PDFParse class)
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
    // fall through to next strategy
  }

  // Strategy 2: Try pdf-parse v1 (default export as function)
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
    // fall through to next strategy
  }

  // Strategy 3: Pure JS regex-based extraction (works always, no native deps)
  try {
    return extractTextViaRegex(buffer);
  } catch {
    return '';
  }
}

/**
 * Fallback pure-JS PDF text extractor using regex on raw binary content.
 * Extracts Tj/TJ PDF operator text without any native dependencies.
 */
function extractTextViaRegex(buffer: Buffer): string {
  const content = buffer.toString('latin1');
  const lines: string[] = [];

  // Match BT...ET text blocks
  const btBlocks = content.match(/BT[\s\S]*?ET/g) || [];

  for (const block of btBlocks) {
    // Match (text)Tj, (text)TJ, [(text)]TJ
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
      if (cleaned.length > 0) {
        lines.push(cleaned);
      }
    }

    // Match [(text1)(text2)]TJ arrays
    const arrayMatches = block.match(/\[([^\]]*)\]\s*TJ/g) || [];
    for (const arr of arrayMatches) {
      const parts = arr.match(/\(([^)]*)\)/g) || [];
      const combined = parts
        .map((p) => p.slice(1, -1))
        .join('')
        .trim();
      if (combined.length > 0) {
        lines.push(combined);
      }
    }
  }

  // Also try plain text stream content if BT blocks gave nothing
  if (lines.length === 0) {
    const streamMatches = content.match(/stream\r?\n([\s\S]*?)\r?\nendstream/g) || [];
    for (const stream of streamMatches) {
      const inner = stream.replace(/^stream\r?\n/, '').replace(/\r?\nendstream$/, '');
      // Only if it looks like printable text
      const printable = inner.replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim();
      if (printable.length > 50) {
        lines.push(printable.substring(0, 2000));
      }
    }
  }

  return lines
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
