import JSZip from 'jszip';

export interface ParsedHWPXResult {
    text: string;
    pageCount: number;
    pages: string[];
}

/**
 * Parse HWPX (Hancom Office) file and extract text content
 * HWPX is a ZIP-based format containing OWPML (XML) files.
 */
export async function parseHWPX(file: File): Promise<ParsedHWPXResult> {
    const arrayBuffer = await file.arrayBuffer();
    const zip = new JSZip();

    // Load the zip file
    const loadedZip = await zip.loadAsync(arrayBuffer);

    // Find all section XML files in Contents/ directory
    // Pattern: Contents/section0.xml, Contents/section1.xml, ...
    const sectionFiles: { name: string; content: string }[] = [];

    // Iterate through files to find sections
    const fileNames = Object.keys(loadedZip.files).filter(name =>
        name.startsWith('Contents/section') && name.endsWith('.xml')
    );

    // Sort files naturally (section0, section1, section2...)
    fileNames.sort((a, b) => {
        const numA = parseInt(a.replace(/[^0-9]/g, ''));
        const numB = parseInt(b.replace(/[^0-9]/g, ''));
        return numA - numB;
    });

    let fullText = '';
    const pages: string[] = [];

    // Process each section
    for (const fileName of fileNames) {
        const fileData = await loadedZip.file(fileName)?.async('string');
        if (fileData) {
            const extractedText = extractTextFromOwpml(fileData);
            if (extractedText.trim()) {
                fullText += extractedText + '\n\n';
                pages.push(extractedText);
            }
        }
    }

    return {
        text: fullText.trim(),
        // HWPX doesn't have fixed pages like PDF, so we use section count as a proxy or just 1
        pageCount: pages.length || 1,
        pages
    };
}

/**
 * Extract text from OWPML (XML) content
 * Target tag: <hp:t> (Text)
 */
function extractTextFromOwpml(xmlContent: string): string {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

    // Find all <hp:t> tags which contain the actual text
    // Note: In some browsers/environments, namespaces might need handling.
    // getElementsByTagName('hp:t') usually works if the parser creates proper elements.
    const textNodes = xmlDoc.getElementsByTagName('hp:t');

    let text = '';
    for (let i = 0; i < textNodes.length; i++) {
        const node = textNodes[i];
        // Check if it's not just empty or structural
        if (node.textContent) {
            text += node.textContent + ' ';
        }
    }

    // Basic cleanup: remove excessive whitespace
    return text.replace(/\s+/g, ' ').trim();
}
