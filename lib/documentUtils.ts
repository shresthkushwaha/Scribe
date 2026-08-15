import { extractTextFromPDF } from './pdfUtils';

/**
 * Extracts plain text content from a given File (.pdf, .docx, .txt, .md).
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') {
    return extractTextFromPDF(file);
  }

  if (extension === 'docx') {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  }

  if (extension === 'txt' || extension === 'md') {
    return file.text();
  }

  throw new Error(`Unsupported file type: .${extension}`);
}
