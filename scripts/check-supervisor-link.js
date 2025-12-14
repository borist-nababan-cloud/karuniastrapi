const { Pool } = require('pg');

const dbConfig = {
  host: 'localhost',
  port: 5433,
  database: 'karuniamotor',
  user: 'postgres',
  password: 'yrkY!SKe5m2@kAkH5T9!'
};

async function checkSupervisorLink() {
  const pool = new Pool(dbConfig);
  const client = await pool.connect();

  try {
    // Check up_users_supervisor_lnk columns
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'up_users_supervisor_lnk'
      ORDER BY ordinal_position
    `);

    console.log('up_users_supervisor_lnk columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSupervisorLink();