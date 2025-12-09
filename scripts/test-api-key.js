import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

console.log(`Reading .env from: ${envPath}`);

if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    // Simple parsing, respecting first '='
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        // Remove quotes if present
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        envVars[key] = val;
    }
});

const embeddingKey = envVars['VITE_GEMINI_EMBEDDING_API_KEY'];

console.log('-'.repeat(50));
console.log('Environment Variable Check:');
if (embeddingKey) {
    console.log(`✅ VITE_GEMINI_EMBEDDING_API_KEY is configured (Ends with: ...${embeddingKey.slice(-4)})`);
} else {
    console.log('❌ VITE_GEMINI_EMBEDDING_API_KEY is MISSING in .env');
}

console.log('-'.repeat(50));

async function testEmbedding() {
    if (!embeddingKey) return;

    console.log('\nTesting Embedding API Key...');
    try {
        const genAI = new GoogleGenerativeAI(embeddingKey);
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

        console.log('Sending request to Google Gemini API...');
        const result = await model.embedContent('Test content for API verification');

        if (result && result.embedding) {
            console.log('✅ SUCCESS! API usage generated an embedding.');
            console.log('The API key is VALID and working.');
        } else {
            console.log('❓ Unexpected response format:', result);
        }
    } catch (error) {
        console.error('❌ FAILURE: API Call Failed');
        console.error('Error message:', error.message);
        if (error.message.includes('API key expired')) {
            console.error('\n⚠️ DIAGNOSIS: The key in .env is indeed EXPIRED or INVALID according to Google.');
            console.error('Please check Google AI Studio to regenerate the key.');
        }
    }
}

testEmbedding();
