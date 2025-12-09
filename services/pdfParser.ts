import * as pdfjsLib from 'pdfjs-dist';
// Set worker source for pdf.js using the static file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export interface ParsedPDFResult {
    text: string;
    pageCount: number;
    pages: string[];
}

/**
 * Parse PDF file and extract text content
 */
export async function parsePDF(file: File): Promise<ParsedPDFResult> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pages: string[] = [];
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');

        pages.push(pageText);
        fullText += pageText + '\n\n';
    }

    return {
        text: fullText.trim(),
        pageCount: pdf.numPages,
        pages
    };
}

/**
 * Split text into chunks for embedding
 */
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end));
        start += chunkSize - overlap;

        if (start >= text.length - overlap) break;
    }

    return chunks;
}
