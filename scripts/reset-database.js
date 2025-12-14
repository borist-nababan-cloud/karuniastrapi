#!/usr/bin/env node

/**
 * Complete database reset script
 * This will completely reset your Strapi database to a clean state
 * - Deletes all content from all tables
 * - Resets auto-increment IDs
 * - Clears all uploaded files
 * - Resets Strapi core store
 */

const fs = require('fs');
const path = require('path');

// Function to get the database type from config
function getDatabaseType() {
  // Check environment variables first
  if (process.env.DATABASE_CLIENT) {
    return process.env.DATABASE_CLIENT;
  }

  // Check .env file
  if (fs.existsSync(path.join(__dirname, '../.env'))) {
    const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
    const match = envContent.match(/DATABASE_CLIENT=([^\s\n]+)/);
    if (match) {
      return match[1];
    }
  }

  // Default to sqlite
  return 'sqlite';
}

// Get database type
const dbType = getDatabaseType();

console.log(`🧹 Resetting ${dbType} database...\n`);

if (dbType === 'sqlite') {
  // For SQLite, the easiest way is to delete the database file
  const dbDir = path.join(__dirname, '../.tmp');
  const dbFile = process.env.DATABASE_FILENAME || 'data.db';
  const dbPath = path.join(dbDir, dbFile);

  try {
    // Stop Strapi first (if running)
    console.log('⚠️  Make sure Strapi is stopped before running this script');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    // Simple delay
    const start = Date.now();
    while (Date.now() - start < 5000) {
      // Wait
    }

    // Delete database directory completely
    if (fs.existsSync(dbDir)) {
      // Remove entire .tmp directory to ensure clean state
      fs.rmSync(dbDir, { recursive: true, force: true });
      console.log(`✅ Deleted database directory: ${dbDir}`);
    }

    // Delete uploads directory
    const uploadsDir = path.join(__dirname, '../public/uploads');
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
      console.log(`✅ Deleted uploads directory: ${uploadsDir}`);
    }

    console.log('\n✨ Database reset completed!');
    console.log('\nNext steps:');
    console.log('1. Start Strapi: npm run develop');
    console.log('2. Create your admin account');
    console.log('3. Add your data manually from the admin panel');

  } catch (error) {
    console.error('\n❌ Error resetting database:', error);
    process.exit(1);
  }

} else {
  // For PostgreSQL or MySQL, provide SQL commands
  console.log('⚠️  You are using PostgreSQL or MySQL');
  console.log('Please run the following SQL commands in your database client:\n');

  const sqlCommands = `-- Disable foreign key constraints temporarily
SET session_replication_role = replica;

-- Clear all data from tables (in correct order)
-- First, clear content-manager tables
TRUNCATE TABLE
  components_shared_buttons,
  components_shared_icons,
  components_shared_items,
  components_shared_pricings,
  components_shared_testimonials,
  articles_maintenances_lnk,
  articles_features_lnk,
  articles_categories_lnk,
  attendances,
  spks,
  branches,
  vehicle_types_group_lnk,
  vehicle_types,
  vehicle_groups,
  articles,
  authors,
  categories,
  abouts,
  globals
RESTART IDENTITY CASCADE;

-- Clear user-permission tables
TRUNCATE TABLE
  up_users_role_lnk,
  up_users_supervisor_lnk,
  up_users_permissions_role_links,
  up_permissions,
  up_users,
  up_roles
RESTART IDENTITY CASCADE;

-- Clear upload tables
TRUNCATE TABLE
  files_related_morphs,
  upload_file,
  upload_folders
RESTART IDENTITY CASCADE;

-- Clear core store tables
TRUNCATE TABLE
  core_store
RESTART IDENTITY CASCADE;

-- Clear any other tables that might exist
TRUNCATE TABLE
  strapi_webhooks,
  strapi_webhook_logs,
  strapi_migrations,
  strapi_meta
RESTART IDENTITY CASCADE;

-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Reset sequences (PostgreSQL specific)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.sequences) THEN
    PERFORM setval(pg_get_serial_sequence('articles', 'id'), 1, false);
    PERFORM setval(pg_get_serial_sequence('authors', 'id'), 1, false);
    PERFORM setval(pg_get_serial_sequence('categories', 'id'), 1, false);
    PERFORM setval(pg_get_serial_sequence('attendances', 'id'), 1, false);
    PERFORM setval(pg_get_serial_sequence('spks', 'id'), 1, false);
    PERFORM setval(pg_get_serial_sequence('branches', 'id'), 1, false);
    PERFORM setval(pg_get_serial_sequence('vehicle_groups', 'id'), 1, false);
    PERFORM setval(pg_get_serial_sequence('vehicle_types', 'id'), 1, false);
    PERFORM setval(pg_get_serial_sequence('up_users', 'id'), 1, false);
    PERFORM setval(pg_get_serial_sequence('upload_file', 'id'), 1, false);
    PERFORM setval(pg_get_serial_sequence('core_store', 'id'), 1, false);
  END IF;
END $$;`;

  console.log(sqlCommands);

  console.log('\nAfter running the SQL commands:');
  console.log('1. Delete the uploads folder: rm -rf public/uploads');
  console.log('2. Restart Strapi: npm run develop');
  console.log('3. Create your admin account');
  console.log('4. Add your data manually from the admin panel');
}

// Also update the bootstrap.ts to remove the seed prompt
console.log('\n📝 Updating bootstrap configuration to remove seed prompt...');
try {
  const bootstrapPath = path.join(__dirname, '../config/bootstrap.ts');
  let bootstrapContent = fs.readFileSync(bootstrapPath, 'utf8');

  // Replace the seed prompt with a cleaner message
  bootstrapContent = bootstrapContent.replace(
    /console\.log\('💡 To seed data, run: npm run console'\);\s*console\.log\('\s*Then copy-paste the script from SEED-INSTRUCTIONS\.md'\);/,
    `console.log('💡 To add data, use the admin panel at http://localhost:1337/admin');`
  );

  fs.writeFileSync(bootstrapPath, bootstrapContent);
  console.log('✅ Updated bootstrap.ts');
} catch (error) {
  console.log('⚠️  Could not update bootstrap.ts file');
}