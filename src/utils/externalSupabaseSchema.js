import { createClient } from '@supabase/supabase-js';

const externalSupabaseUrl = 'https://ftsboryogzngqfarbbgu.supabase.co';
const externalSupabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0c2JvcnlvZ3puZ3FmYXJiYmd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzMzMzQ1MSwiZXhwIjoyMDY4OTA5NDUxfQ.GPLzn7DeCqPJuHGN23i5gO7-3ZygoxIdxMJkSqqczt4';

const externalSupabase = createClient(externalSupabaseUrl, externalSupabaseServiceRoleKey);

// Always run the script logic when executed
(async () => {
  // Fetch all tables in the public schema
  const { data: tables, error: tableError } = await externalSupabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  if (tableError) {
    console.error('Error fetching tables:', tableError);
    return;
  }

  console.log('Tables:', tables);

  for (const table of tables) {
    const tableName = table.table_name;
    const { data: columns, error: columnError } = await externalSupabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', tableName);
    if (columnError) {
      console.error(`Error fetching columns for ${tableName}:`, columnError);
      continue;
    }
    console.log(`\nTable: ${tableName}`);
    console.table(columns);
  }
})();
