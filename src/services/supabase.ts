import { createClient } from '@supabase/supabase-js';

// ATENÇÃO: A URL correta do seu projeto
const SUPABASE_URL = 'https://uxmfaqgtfkbmvvkxmhx.supabase.co'; 

// ATENÇÃO: A chave anon que você acabou de me mandar
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bWZhcXRnZmtibXZ2dmttaG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1Nzk5NDYsImV4cCI6MjEwMjE1NTk0Nn0.na8pUu4W3xcyjVk1C3RTyuuwW1nBKpiwueonBG-xmB8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);