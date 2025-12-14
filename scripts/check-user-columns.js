const { Pool } = require('pg');

const dbConfig = {
  host: 'localhost',
  port: 5433,
  database: 'karuniamotor',
  user: 'postgres',
  password: 'yrkY!SKe5m2@kAkH5T9!'
};

async function checkUserColumns() {
  const pool = new Pool(dbConfig);
  const client = await pool.connect();

  try {
    // Check up_users columns
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'up_users'
      ORDER BY ordinal_position
    `);

    console.log('up_users columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

    // Check up_users_role_lnk structure
    const roleLink = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'up_users_role_lnk'
      ORDER BY ordinal_position
    `);

    console.log('\nup_users_role_lnk columns:');
    roleLink.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

    // Get role information
    const roles = await client.query(`
      SELECT id, type, name FROM up_roles
    `);

    console.log('\nAvailable roles:');
    roles.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.type}) - ID: ${row.id}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUserColumns();