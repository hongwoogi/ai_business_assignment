import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.warn('Gemini API key not found.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface GrantAnalysis {
    title: string;
    grantType: string;
    supportAmount: string;
    period: string;
    deadline: string;
    description: string;
    region: string;
    industry: string;
    eligibility: string;
    requiredDocuments: string[];
}

// Helper for retry logic
async function safeGenerateContent(prompt: string, modelName: string = 'gemini-2.5-flash'): Promise<string> {
    if (!genAI) throw new Error('Gemini API is not configured');

    const modelsToTry = [modelName, 'gemini-1.5-flash'];
    let lastError: any;

    for (const model of modelsToTry) {
        try {
            const aiModel = genAI.getGenerativeModel({ model });

            // Simple retry with backoff for 429
            let attempts = 0;
            while (attempts < 3) {
                try {
                    const result = await aiModel.generateContent(prompt);
                    const response = await result.response;
                    return response.text();
                } catch (error: any) {
                    if (error.message?.includes('429') || error.status === 429) {
                        attempts++;
                        console.log(`Rate limit hit for ${model}, retrying (${attempts}/3)...`);
                        await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
                        continue;
                    }
                    throw error; // Throw other errors to next catch block (fallback model)
                }
            }
        } catch (error: any) {
            console.warn(`Failed with model ${model}:`, error.message);
            lastError = error;
            // Continue to next model
        }
    }

    throw lastError || new Error('All models failed');
}

/**
 * Analyze grant document content using Gemini AI
 */
export async function analyzeGrantDocument(content: string): Promise<GrantAnalysis> {
    const prompt = `다음은 정부지원사업 공고문입니다. 아래 내용을 분석하여 JSON 형식으로 정보를 추출해주세요.

공고문 내용:
${content}

다음 형식으로 응답해주세요 (JSON만 응답, 다른 텍스트 없이):
{
  "title": "사업명",
  "grantType": "공고 유형 (창업지원, R&D, 수출지원, 인력양성, 시설투자 등)",
  "supportAmount": "지원 규모 (예: 최대 5,000만원)",
  "period": "접수 기간 (예: 2024-01-01 ~ 2024-06-30)",
  "deadline": "결과보고 마감일 또는 사업종료일",
  "description": "사업 개요 요약 (2-3문장)",
  "region": "지원 지역 (서울, 경기, 전국 등)",
  "industry": "대상 분야 (핵심 키워드 1-3개, 쉼표로 구분. 예: IT, 바이오, 제조)",
  "eligibility": "신청 자격 요약",
  "requiredDocuments": ["필요 서류1", "필요 서류2"]
}`;

    try {
        const text = await safeGenerateContent(prompt, 'gemini-2.5-flash');

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to extract JSON from response');
        }

        return JSON.parse(jsonMatch[0]) as GrantAnalysis;
    } catch (error) {
        console.error('Error analyzing grant document:', error);
        throw error;
    }
}

/**
 * Generate AI response for chat based on context
 */
export async function generateChatResponse(
    question: string,
    context: string,
    grantTitle: string
): Promise<string> {
    const prompt = `당신은 정부지원사업 공고 전문 상담 AI입니다. 
사용자가 "${grantTitle}" 공고에 대해 질문하고 있습니다.

관련 공고 내용:
${context}

사용자 질문: ${question}

위 공고 내용을 바탕으로 친절하고 정확하게 답변해주세요. 
공고 내용에 없는 정보는 추측하지 말고, 해당 정보가 공고에 명시되어 있지 않다고 안내해주세요.
답변은 한국어로 작성해주세요.`;

    try {
        return await safeGenerateContent(prompt, 'gemini-2.5-flash');
    } catch (error) {
        console.error('Error generating chat response:', error);
        throw error;
    }
}
