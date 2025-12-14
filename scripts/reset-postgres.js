#!/usr/bin/env node

/**
 * PostgreSQL Database Reset Script for Strapi v5
 * This will completely reset your PostgreSQL database
 */

console.log('🧹 PostgreSQL Database Reset Script');
console.log('===================================\n');

console.log('⚠️  Make sure Strapi is stopped before running this script');
console.log('⚠️  This will DELETE ALL DATA in your database\n');

// Get database configuration from environment
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'strapi',
  user: process.env.DATABASE_USERNAME || 'strapi',
  password: process.env.DATABASE_PASSWORD || 'strapi',
};

const { Pool } = require('pg');
const pool = new Pool(dbConfig);

async function resetDatabase() {
  const client = await pool.connect();

  try {
    // Get all table names first
    console.log('1. Getting database tables...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const allTables = tablesResult.rows.map(row => row.table_name);
    console.log(`   Found ${allTables.length} tables`);

    // Group tables by type for proper deletion order
    const contentTables = allTables.filter(t =>
      t.startsWith('articles_') ||
      t.startsWith('authors_') ||
      t.startsWith('categories_') ||
      t.startsWith('abouts_') ||
      t.startsWith('globals_') ||
      t.startsWith('attendances_') ||
      t.startsWith('spks_') ||
      t.startsWith('branches_') ||
      t.startsWith('vehicle_groups_') ||
      t.startsWith('vehicle_types_')
    );

    const joinTables = allTables.filter(t => t.includes('_lnk') || t.includes('_links'));

    const userTables = allTables.filter(t => t.startsWith('up_'));

    const uploadTables = allTables.filter(t => t.startsWith('upload_'));

    const coreTables = allTables.filter(t =>
      t.startsWith('strapi_') ||
      t === 'core_store'
    );

    console.log('\n2. Disabling constraints...');
    await client.query('SET session_replication_role = replica;');

    console.log('\n3. Truncating tables...');

    // Truncate content tables
    if (contentTables.length > 0) {
      console.log(`   Content tables: ${contentTables.join(', ')}`);
      await client.query(`TRUNCATE TABLE ${contentTables.join(', ')} RESTART IDENTITY CASCADE;`);
    }

    // Truncate join tables
    if (joinTables.length > 0) {
      console.log(`   Join tables: ${joinTables.join(', ')}`);
      await client.query(`TRUNCATE TABLE ${joinTables.join(', ')} RESTART IDENTITY CASCADE;`);
    }

    // Truncate user tables
    if (userTables.length > 0) {
      console.log(`   User tables: ${userTables.join(', ')}`);
      await client.query(`TRUNCATE TABLE ${userTables.join(', ')} RESTART IDENTITY CASCADE;`);
    }

    // Truncate upload tables
    if (uploadTables.length > 0) {
      console.log(`   Upload tables: ${uploadTables.join(', ')}`);
      await client.query(`TRUNCATE TABLE ${uploadTables.join(', ')} RESTART IDENTITY CASCADE;`);
    }

    // Truncate core tables
    if (coreTables.length > 0) {
      console.log(`   Core tables: ${coreTables.join(', ')}`);
      await client.query(`TRUNCATE TABLE ${coreTables.join(', ')} RESTART IDENTITY CASCADE;`);
    }

    // Handle any remaining tables not categorized
    const remainingTables = allTables.filter(t =>
      !contentTables.includes(t) &&
      !joinTables.includes(t) &&
      !userTables.includes(t) &&
      !uploadTables.includes(t) &&
      !coreTables.includes(t)
    );

    if (remainingTables.length > 0) {
      console.log(`   Remaining tables: ${remainingTables.join(', ')}`);
      await client.query(`TRUNCATE TABLE ${remainingTables.join(', ')} RESTART IDENTITY CASCADE;`);
    }

    console.log('\n4. Re-enabling constraints...');
    await client.query('SET session_replication_role = DEFAULT;');

    console.log('\n✅ Database reset completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Delete the uploads folder manually:');
    console.log('   rm -rf public/uploads');
    console.log('\n2. Start Strapi:');
    console.log('   npm run develop');
    console.log('\n3. Create your admin account');
    console.log('4. Add your data manually from the admin panel');

  } catch (error) {
    console.error('\n❌ Error resetting database:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure your database connection details are correct in .env');
    console.log('2. Ensure you have DROP/DELETE permissions on the database');
    console.log('3. Check if the database exists');
  } finally {
    client.release();
    await pool.end();
  }
}

// Alternative: Provide SQL commands if connection fails
const sqlCommands = `
-- PostgreSQL Database Reset Commands
-- Run these commands manually in your PostgreSQL client (pgAdmin, DBeaver, psql)

-- Disable constraints
SET session_replication_role = replica;

-- Get all tables and truncate them
DO $$
DECLARE
    table_record RECORD;
    tables_to_truncate TEXT[];
BEGIN
    -- Get all table names
    FOR table_record IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        tables_to_truncate := array_append(tables_to_truncate, table_record.table_name);
    END LOOP;

    -- Build and execute the TRUNCATE command
    IF array_length(tables_to_truncate, 1) > 0 THEN
        EXECUTE 'TRUNCATE TABLE ' || array_to_string(tables_to_truncate, ', ') || ' RESTART IDENTITY CASCADE';
    END IF;
END $$;

-- Re-enable constraints
SET session_replication_role = DEFAULT;

-- Show message
DO $$
BEGIN
    RAISE NOTICE 'Database has been reset. All tables truncated.';
END $$;
`;

console.log('\n' + '='.repeat(50));
console.log('Two options to reset your database:');
console.log('='.repeat(50));
console.log('\n1. Run this script with your database credentials in .env');
console.log('2. Or run the SQL commands manually (see below)');
console.log('\nSQL Commands (copy and paste into PostgreSQL client):');
console.log('='.repeat(50));
console.log(sqlCommands);

// Try to run the reset automatically
resetDatabase().catch(err => {
  console.log('\n⚠️  Could not connect to database automatically');
  console.log('Please run the SQL commands manually above');
});