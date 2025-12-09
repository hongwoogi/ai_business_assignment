import { supabase, isSupabaseConfigured } from './supabaseClient';
import { parsePDF, chunkText } from './pdfParser';
import { parseHWPX } from './hwpxParser';
import { analyzeGrantDocument, GrantAnalysis } from './geminiService';
import { generateEmbeddings } from './embeddingService';
import { Grant } from '../types';

// In-memory storage for when Supabase is not configured
let localGrants: Grant[] = [];
let localEmbeddings: Map<string, { content: string; embedding: number[] }[]> = new Map();

export interface ProcessingStatus {
    step: 'parsing' | 'analyzing' | 'embedding' | 'saving' | 'complete' | 'error';
    message: string;
    progress: number;
}

export type StatusCallback = (status: ProcessingStatus) => void;

/**
 * Process uploaded PDF or HWPX and save to database
 */
export async function processGrantDocument(
    file: File,
    onStatusChange: StatusCallback
): Promise<Grant> {
    try {
        // Step 1: Parse Document
        onStatusChange({ step: 'parsing', message: '문서를 파싱하고 있습니다...', progress: 10 });

        let text = '';
        let pageCount = 0;

        if (file.name.toLowerCase().endsWith('.hwpx')) {
            console.log('Detected HWPX file');
            const result = await parseHWPX(file);
            text = result.text;
            pageCount = result.pageCount;
        } else {
            console.log('Detected PDF file');
            const result = await parsePDF(file);
            text = result.text;
            pageCount = result.pageCount;
        }

        console.log(`파싱 완료: ${pageCount} 페이지/섹션, ${text.length} 글자 추출됨`);
        console.log('추출된 텍스트 미리보기:', text.substring(0, 500));

        if (!text || text.length < 10) {
            throw new Error(`문서에서 텍스트를 추출할 수 없습니다. (추출된 글자 수: ${text?.length || 0}) 텍스트가 없는 이미지 문서일 수 있습니다.`);
        }

        // Step 2: Analyze with Gemini
        onStatusChange({ step: 'analyzing', message: 'AI가 공고 내용을 분석하고 있습니다...', progress: 30 });
        const analysis = await analyzeGrantDocument(text);

        // Step 3: Generate embeddings
        onStatusChange({ step: 'embedding', message: '문서를 임베딩하고 있습니다...', progress: 50 });
        const chunks = chunkText(text);
        const embeddings = await generateEmbeddings(chunks);

        // Step 4: Save to database
        onStatusChange({ step: 'saving', message: '데이터베이스에 저장하고 있습니다...', progress: 80 });

        const grant = await saveGrant(analysis, text);
        await saveEmbeddings(grant.id, chunks, embeddings);

        onStatusChange({ step: 'complete', message: '처리 완료!', progress: 100 });

        return grant;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
        onStatusChange({ step: 'error', message: errorMessage, progress: 0 });
        throw error;
    }
}

/**
 * Calculate grant status based on today's date
 */
function calculateGrantStatus(period: string, deadline: string): 'Open' | 'Closed' | 'Upcoming' | undefined {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Try to parse deadline first
    if (deadline) {
        // Try to find YYYY-MM-DD pattern
        const dateMatch = deadline.match(/(\d{4})[-\.](\d{1,2})[-\.](\d{1,2})/);
        if (dateMatch) {
            const deadlineDate = new Date(
                parseInt(dateMatch[1]),
                parseInt(dateMatch[2]) - 1,
                parseInt(dateMatch[3])
            );
            if (today > deadlineDate) return 'Closed';
        }
    }

    // Try to parse period (Start ~ End)
    if (period) {
        const parts = period.split('~').map(p => p.trim());
        if (parts.length === 2) {
            // Check start date for "Upcoming"
            const startMatch = parts[0].match(/(\d{4})[-\.](\d{1,2})[-\.](\d{1,2})/);
            if (startMatch) {
                const startDate = new Date(
                    parseInt(startMatch[1]),
                    parseInt(startMatch[2]) - 1,
                    parseInt(startMatch[3])
                );
                if (today < startDate) return 'Upcoming';
            }

            // Check end date for "Closed"
            const endMatch = parts[1].match(/(\d{4})[-\.](\d{1,2})[-\.](\d{1,2})/);
            if (endMatch) {
                const endDate = new Date(
                    parseInt(endMatch[1]),
                    parseInt(endMatch[2]) - 1,
                    parseInt(endMatch[3])
                );
                if (today > endDate) return 'Closed';
            }
        }
    }

    // Default to 'Open' if we can't determine it's closed or upcoming
    return 'Open';
}

/**
 * Save grant to database or local storage
 */
async function saveGrant(analysis: GrantAnalysis, rawContent: string): Promise<Grant> {
    const grantId = `GRANT-${Date.now()}`;
    const calculatedStatus = calculateGrantStatus(analysis.period, analysis.deadline);

    const grant: Grant = {
        id: grantId,
        title: analysis.title,
        supportAmount: analysis.supportAmount,
        period: analysis.period,
        deadline: analysis.deadline,
        description: analysis.description,
        region: analysis.region,
        industry: analysis.industry,
        status: calculatedStatus,
        grantType: analysis.grantType,
        rawContent: rawContent,
        eligibility: analysis.eligibility,
        requiredDocuments: analysis.requiredDocuments
    };

    if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase.from('grants').insert({
            id: grantId,
            title: analysis.title,
            support_amount: analysis.supportAmount,
            period: analysis.period,
            deadline: analysis.deadline,
            description: analysis.description,
            region: analysis.region,
            industry: analysis.industry,
            status: calculatedStatus,
            grant_type: analysis.grantType,
            raw_content: rawContent
        });

        if (error) {
            console.error('Error saving grant to Supabase:', error);
            // Alert the user about the DB error for debugging
            alert(`DB 저장 실패: ${error.message || JSON.stringify(error)}`);
            // Fallback to local storage
            localGrants.push(grant);
        }
    } else {
        localGrants.push(grant);
    }

    return grant;
}

/**
 * Save embeddings to database or local storage
 */
async function saveEmbeddings(
    grantId: string,
    chunks: string[],
    embeddings: number[][]
): Promise<void> {
    const embeddingData = chunks.map((content, index) => ({
        content,
        embedding: embeddings[index]
    }));

    if (isSupabaseConfigured() && supabase) {
        const records = chunks.map((content, index) => ({
            grant_id: grantId,
            chunk_index: index,
            content,
            embedding: embeddings[index]
        }));

        const { error } = await supabase.from('grant_embeddings').insert(records);

        if (error) {
            console.error('Error saving embeddings to Supabase:', error);
            localEmbeddings.set(grantId, embeddingData);
        }
    } else {
        localEmbeddings.set(grantId, embeddingData);
    }
}

/**
 * Get all grants from database or local storage
 */
export async function getGrants(): Promise<Grant[]> {
    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
            .from('grants')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching grants:', error);
            return localGrants;
        }

        return data.map((row: any) => ({
            id: row.id,
            title: row.title,
            supportAmount: row.support_amount,
            period: row.period,
            deadline: row.deadline,
            description: row.description,
            region: row.region,
            industry: row.industry,
            status: calculateGrantStatus(row.period, row.deadline), // Recalculate status on fetch
            grantType: row.grant_type,
            rawContent: row.raw_content
        }));
    }

    // For local grants, also recalculate status
    return localGrants.map(g => ({
        ...g,
        status: calculateGrantStatus(g.period, g.deadline)
    }));
}

/**
 * Get grant by ID
 */
export async function getGrantById(id: string): Promise<Grant | null> {
    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
            .from('grants')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            const local = localGrants.find(g => g.id === id);
            if (local) {
                return {
                    ...local,
                    status: calculateGrantStatus(local.period, local.deadline)
                };
            }
            return null;
        }

        return {
            id: data.id,
            title: data.title,
            supportAmount: data.support_amount,
            period: data.period,
            deadline: data.deadline,
            description: data.description,
            region: data.region,
            industry: data.industry,
            status: calculateGrantStatus(data.period, data.deadline), // Recalculate status on fetch
            grantType: data.grant_type,
            rawContent: data.raw_content
        };
    }

    const local = localGrants.find(g => g.id === id);
    if (local) {
        return {
            ...local,
            status: calculateGrantStatus(local.period, local.deadline)
        };
    }
    return null;
}

/**
 * Get embeddings for a grant
 */
export async function getGrantEmbeddings(
    grantId: string
): Promise<{ content: string; embedding: number[] }[]> {
    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
            .from('grant_embeddings')
            .select('content, embedding')
            .eq('grant_id', grantId)
            .order('chunk_index', { ascending: true });

        if (error || !data) {
            return localEmbeddings.get(grantId) || [];
        }

        return data.map((row: any) => ({
            content: row.content,
            embedding: row.embedding
        }));
    }

    return localEmbeddings.get(grantId) || [];
}

/**
 * Add a grant directly (for testing or manual entry)
 */
export function addLocalGrant(grant: Grant): void {
    localGrants.push(grant);
}

/**
 * Get local grants (for components that need immediate access)
 * Deprecated: Use getGrants() instead
 */
export function getLocalGrants(): Grant[] {
    return localGrants;
}
