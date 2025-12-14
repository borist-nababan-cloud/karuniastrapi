const { Pool } = require('pg');

const dbConfig = {
  host: 'localhost',
  port: 5433,
  database: 'karuniamotor',
  user: 'postgres',
  password: 'yrkY!SKe5m2@kAkH5T9!'
};

async function checkRelationTables() {
  const pool = new Pool(dbConfig);
  const client = await pool.connect();

  try {
    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('All tables in database:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Check for relation link tables
    console.log('\nChecking for relation link tables...');
    const linkTables = tablesResult.rows
      .filter(row => row.table_name.includes('_'))
      .filter(row => row.table_name.includes('type') || row.table_name.includes('group') || row.table_name.includes('branch'));

    linkTables.forEach(table => {
      console.log(`\n${table.table_name}:`);
      const columns = client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = '${table.table_name}'
        ORDER BY ordinal_position
      `);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkRelationTables();