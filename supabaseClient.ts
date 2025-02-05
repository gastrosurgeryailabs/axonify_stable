// Keeping Supabase configuration for future reference
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration (commented out as we're using direct PostgreSQL now)
// const supabaseUrl = 'https://iwjqlyvsakfjvosiuktf.supabase.co'
// const supabaseKey = process.env.SUPABASE_KEY

const supabaseUrl = 'https://iwjqlyvsakfjvosiuktf.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('supabaseUrl and supabaseKey are required.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Placeholder for direct PostgreSQL client if needed
// You can remove this comment and add direct PostgreSQL client configuration here
