
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

console.log('Testing Supabase Connection via Node.js...');

try {
    if (!fs.existsSync(envPath)) {
        console.error('Error: .env file not found at', envPath);
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

    if (!urlMatch || !keyMatch) {
        console.error('Error: Could not find VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
        process.exit(1);
    }

    const supabaseUrl = urlMatch[1].trim();
    const supabaseKey = keyMatch[1].trim();

    console.log('Found URL:', supabaseUrl);
    console.log('Found Key:', supabaseKey.substring(0, 10) + '...');

    const supabase = createClient(supabaseUrl, supabaseKey);

    async function testConnection() {
        console.log('\n--- Attempting to Select from "grants" table ---');
        const { data, error, count } = await supabase
            .from('grants')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('\n[FATAL ERROR] Select Failed:');
            console.error(JSON.stringify(error, null, 2));

            if (error.code === '42501') {
                console.log('\n[DIAGNOSIS] Permission Denied (RLS Policy Issue).');
                console.log('Please run the RLS policies SQL provided properly.');
            } else if (error.code === 'PGRST301') {
                console.log('\n[DIAGNOSIS] Table does not exist or RLS blocking visibility.');
            }
        } else {
            console.log('\n[SUCCESS] Select Successful! Row Count:', count);
        }

        console.log('\n--- Attempting to INSERT dummy record ---');
        const dummyId = `DEBUG-${Date.now()}`;
        const { data: insertData, error: insertError } = await supabase
            .from('grants')
            .insert({
                id: dummyId,
                title: 'Debug Grant',
                status: 'Open',
                deadline: '2025-12-31'
            })
            .select();

        if (insertError) {
            console.error('\n[FATAL ERROR] Insert Failed:');
            console.error(JSON.stringify(insertError, null, 2));
            if (insertError.code === '42501') {
                console.log('\n[DIAGNOSIS] WRITE Permission Denied (RLS). You have Read but not Write.');
            }
        } else {
            console.log('\n[SUCCESS] Insert Successful!');
            // Cleanup
            await supabase.from('grants').delete().eq('id', dummyId);
            console.log('Dummy record cleaned up.');
        }
    }

    testConnection();

} catch (err) {
    console.error('Script execution error:', err);
}
