import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

// Parse .env manually
if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    process.exit(1);
}
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        envVars[key] = val;
    }
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseKey = envVars['VITE_SUPABASE_ANON_KEY'];
const embeddingKey = envVars['VITE_GEMINI_EMBEDDING_API_KEY'];

console.log('--- Configuration ---');
console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`Embedding Key: ...${embeddingKey?.slice(-4)}`);

async function checkDimensions() {
    // 1. Generate new embedding
    console.log('\n1️⃣  Generating NEW embedding with text-embedding-004...');
    const genAI = new GoogleGenerativeAI(embeddingKey);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    let newEmbeddingLength = 0;
    try {
        const result = await model.embedContent('Test content');
        const values = result.embedding.values;
        newEmbeddingLength = values.length;
        console.log(`✅ New embedding dimension: ${newEmbeddingLength}`);
    } catch (e) {
        console.error('❌ Failed to generate embedding:', e.message);
        return;
    }

    // 2. Fetch stored embedding
    console.log('\n2️⃣  Fetching STORED embedding from Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
        .from('grant_embeddings')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Supabase error:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.warn('⚠️ No embeddings found in Supabase table "grant_embeddings".');
        return;
    }

    let storedEmbedding = data[0].embedding;

    // Parse if it's stored as string
    if (typeof storedEmbedding === 'string') {
        try {
            storedEmbedding = JSON.parse(storedEmbedding);
        } catch (e) {
            console.log('Stored embedding is a string but not JSON parsable?');
        }
    }

    const storedEmbeddingLength = storedEmbedding.length;
    console.log(`✅ Stored embedding dimension: ${storedEmbeddingLength}`);
    console.log(`(Sample ID: ${data[0].id})`);

    // 3. Compare
    console.log('\n--- Conclusion ---');
    if (newEmbeddingLength === storedEmbeddingLength) {
        console.log('✅ Dimensions MATCH. The error might be specific to a certain record or array format.');
    } else {
        console.error(`❌ Dimensions MISMATCH! New: ${newEmbeddingLength} vs Stored: ${storedEmbeddingLength}`);
        console.error('👉 The stored embeddings are incompatible with the current model.');
        console.error('👉 Solution: Delete the grant and re-upload it to regenerate embeddings.');
    }
}

checkDimensions();
