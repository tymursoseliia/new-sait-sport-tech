const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Ручной парсинг .env
function getEnv() {
    const envPath = path.join(__dirname, '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length === 2) {
            env[parts[0].trim()] = parts[1].trim();
        }
    });
    return env;
}

const env = getEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not found in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearCars() {
    console.log('Cleaning cars table...');
    const { data, error } = await supabase
        .from('cars')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Удалить всё

    if (error) {
        console.error('Error clearing cars:', error);
    } else {
        console.log('Cars table cleared successfully!');
    }
}

clearCars();
