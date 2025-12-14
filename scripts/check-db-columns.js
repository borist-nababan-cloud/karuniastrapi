const { Pool } = require('pg');

const dbConfig = {
  host: 'localhost',
  port: 5433,
  database: 'karuniamotor',
  user: 'postgres',
  password: 'yrkY!SKe5m2@kAkH5T9!'
};

async function checkColumns() {
  const pool = new Pool(dbConfig);
  const client = await pool.connect();

  try {
    // Check vehicle_types columns
    const result = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'vehicle_types'
      ORDER BY ordinal_position
    `);

    console.log('vehicle_types columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });

    // Check spks columns
    const spkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'spks'
      ORDER BY ordinal_position
    `);

    console.log('\nspks columns:');
    spkResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });

    // Check attendances columns
    const attResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'attendances'
      ORDER BY ordinal_position
    `);

    console.log('\nattendances columns:');
    attResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkColumns();