/** Shared hardening for untrusted PDF uploads (mission extract + invoice batch). */

export const MAX_PDF_BYTES = 10 * 1024 * 1024;

/** Every PDF starts with this signature; the client-sent mimetype is not trusted. */
const PDF_MAGIC = Buffer.from('%PDF-');

export function isPdf(buffer: Buffer): boolean {
  return buffer.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC);
}

/** The upload filename is untrusted (shown in the UI, fed to the LLM brief):
 *  drop path separators and control chars, and cap the length. */
export function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[/\\]/g, '_')
      .replace(/\p{Cc}/gu, ' ')
      .trim()
      .slice(0, 100) || 'dossier.pdf'
  );
}
