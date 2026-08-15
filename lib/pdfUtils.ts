function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement;
    if (existing) {
      if ((window as any).pdfjsLib) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)));
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Extracts all text from a PDF file using standalone browser pdf.js without Webpack bundling issues.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  if (typeof window === 'undefined') return '';

  // 1. Ensure PDF.js is loaded into window.pdfjsLib
  if (!(window as any).pdfjsLib) {
    try {
      await loadScript('/pdf.min.js');
    } catch {
      // Fallback to CDN if local file fails
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    }
  }

  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) {
    throw new Error('PDF.js library could not be initialized.');
  }

  // 2. Configure worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    let pdf;
    try {
      const loadingTask = pdfjsLib.getDocument({
        data,
        useSystemFonts: true,
      });
      pdf = await loadingTask.promise;
    } catch (workerErr) {
      console.warn("Worker loading failed, falling back to main thread:", workerErr);
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      const fallbackTask = pdfjsLib.getDocument({
        data,
        useSystemFonts: true,
      });
      pdf = await fallbackTask.promise;
    }

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .filter(Boolean)
        .join(' ');

      if (pageText.trim()) {
        fullText += pageText.trim() + '\n\n';
      }
    }

    return fullText.trim();
  } catch (err: any) {
    console.error("PDF Extraction Failure:", err);
    throw new Error(err?.message || "Failed to parse PDF document.");
  }
}
