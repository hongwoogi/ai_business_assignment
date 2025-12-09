import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_EMBEDDING_API_KEY;

if (!apiKey) {
    console.warn('Gemini Embedding API key not found.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Generate embedding for text using Gemini Embedding API
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    if (!genAI) {
        throw new Error('Gemini Embedding API is not configured');
    }

    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    let attempts = 0;
    while (attempts < 3) {
        try {
            const result = await model.embedContent(text);
            return result.embedding.values;
        } catch (error: any) {
            if (error.message?.includes('429') || error.status === 429) {
                attempts++;
                console.log(`Rate limit hit for embedding, retrying (${attempts}/3)...`);
                await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
                continue;
            }
            console.error('Error generating embedding:', error);
            throw error;
        }
    }
    throw new Error('Failed to generate embedding after retries');
}

/**
 * Generate embeddings for multiple text chunks
 */
export async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk);
        embeddings.push(embedding);
    }

    return embeddings;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find most similar chunks based on query embedding
 */
export function findSimilarChunks(
    queryEmbedding: number[],
    chunkEmbeddings: { content: string; embedding: number[] }[],
    topK: number = 3
): { content: string; similarity: number }[] {
    const similarities = chunkEmbeddings.map(chunk => ({
        content: chunk.content,
        similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
}
