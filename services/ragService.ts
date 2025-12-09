import { generateEmbedding, findSimilarChunks } from './embeddingService';
import { generateChatResponse } from './geminiService';
import { getGrantEmbeddings, getGrantById } from './grantService';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

/**
 * Process user question and generate RAG-based response
 */
export async function askQuestion(
    grantId: string,
    question: string
): Promise<string> {
    // Get grant details
    const grant = await getGrantById(grantId);
    if (!grant) {
        throw new Error('공고를 찾을 수 없습니다.');
    }

    // Get embeddings for this grant
    const embeddings = await getGrantEmbeddings(grantId);

    let context: string;

    if (embeddings.length > 0) {
        // Generate embedding for the question
        const queryEmbedding = await generateEmbedding(question);

        // Find similar chunks
        const similarChunks = findSimilarChunks(queryEmbedding, embeddings, 3);

        // Build context from similar chunks
        context = similarChunks.map(chunk => chunk.content).join('\n\n');
    } else if (grant.rawContent) {
        // Fallback to raw content if no embeddings
        context = grant.rawContent.substring(0, 4000);
    } else if (grant.description) {
        // Fallback to description
        context = grant.description;
    } else {
        context = `사업명: ${grant.title}\n지원 규모: ${grant.supportAmount}\n접수 기간: ${grant.period}`;
    }

    // Generate response using Gemini
    const response = await generateChatResponse(question, context, grant.title);

    return response;
}

/**
 * Create a new chat message
 */
export function createMessage(role: 'user' | 'assistant', content: string): ChatMessage {
    return {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role,
        content,
        timestamp: new Date()
    };
}
