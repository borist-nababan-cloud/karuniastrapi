const { Client } = require('pg');

// Read database connection from environment
require('dotenv').config();
const client = new Client({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
});

async function checkDatabase() {
  try {
    await client.connect();

    console.log('\n=== Checking Database Tables ===\n');

    // Check if spks table exists
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'spks'
    `);

    if (result.rows.length > 0) {
      console.log('✅ spks table exists');

      // Get table structure
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'spks'
        ORDER BY ordinal_position
      `);

      console.log('\nTable structure:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'})`);
      });

      // Check if there's any data
      const count = await client.query('SELECT COUNT(*) FROM spks');
      console.log(`\nTotal records: ${count.rows[0].count}`);

    } else {
      console.log('❌ spks table does NOT exist');

      // List all tables to see what exists
      const allTables = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

      console.log('\nExisting tables:');
      allTables.rows.forEach(t => {
        console.log(`  - ${t.table_name}`);
      });
    }

    // Check what permission-related tables exist
    console.log('\n=== Checking Permission Tables ===');
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND (table_name LIKE '%permission%' OR table_name LIKE '%role%')
      ORDER BY table_name
    `);

    console.log('Permission/Role related tables:');
    tables.rows.forEach(t => {
      console.log(`  - ${t.table_name}`);
    });

    // Check if there's a permissions table and look for SPK permissions
    const permTable = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'up_permissions'
    `);

    if (permTable.rows.length > 0) {
      const permissions = await client.query(`
        SELECT DISTINCT action
        FROM up_permissions
        WHERE action LIKE '%spk%'
      `);

      if (permissions.rows.length > 0) {
        console.log('\nSPK permissions found:');
        permissions.rows.forEach(p => {
          console.log(`  - ${p.action}`);
        });
      } else {
        console.log('\n❌ No SPK permissions found in database');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkDatabase();