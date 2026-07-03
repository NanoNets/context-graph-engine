import { readFile } from "node:fs/promises";

/**
 * Extract plain text from a PDF file.
 *
 * Uses `unpdf` (a pure-JS build of pdf.js) so there are no native binaries to
 * compile — it works anywhere Node runs, which keeps the `curl | sh` install
 * story honest. Pages are merged into a single string for chunking.
 */
export async function extractPdfText(path: string): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const buffer = await readFile(path);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n\n") : text;
}

/** True if the path looks like a PDF (by extension). */
export function isPdfPath(path: string): boolean {
  return /\.pdf$/i.test(path);
}
