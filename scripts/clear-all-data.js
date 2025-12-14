#!/usr/bin/env node

/**
 * Complete database cleanup script
 * This will remove ALL content from your Strapi database, returning it to a clean state
 * WARNING: This will delete ALL your data - use with caution!
 */

const fs = require('fs');
const path = require('path');

// Get database configuration from environment or use defaults
const isSQLite = process.env.DATABASE_CLIENT === 'sqlite' || !process.env.DATABASE_CLIENT;

if (isSQLite) {
  // For SQLite, we can just delete the database file
  const dbPath = process.env.DATABASE_FILENAME || path.join(__dirname, '../.tmp/data.db');

  console.log('🧹 Cleaning up SQLite database...\n');

  try {
    if (fs.existsSync(dbPath)) {
      // Delete the database file
      fs.unlinkSync(dbPath);
      console.log(`✅ Deleted SQLite database: ${dbPath}`);

      // Also delete the temp directory if it exists
      const tmpDir = path.join(__dirname, '../.tmp');
      if (fs.existsSync(tmpDir)) {
        const files = fs.readdirSync(tmpDir);
        for (const file of files) {
          if (file.startsWith('data') || file.includes('.db')) {
            const filePath = path.join(tmpDir, file);
            fs.unlinkSync(filePath);
            console.log(`✅ Deleted: ${filePath}`);
          }
        }
      }
    } else {
      console.log('ℹ️  No database file found to delete');
    }
  } catch (error) {
    console.error('❌ Error deleting SQLite database:', error);
    process.exit(1);
  }

  console.log('\n✨ Database cleaned successfully!');
  console.log('\nNext steps:');
  console.log('1. Start Strapi: npm run develop');
  console.log('2. Go through the initial setup');
  console.log('3. Add your data manually from the admin panel');

} else {
  // For PostgreSQL/MySQL
  console.log('⚠️  This script detected you are using PostgreSQL/MySQL');
  console.log('For PostgreSQL/MySQL, please run the following SQL commands:');
  console.log('\n-- Copy and run these commands in your database client:\n');

  console.log(`-- Disable constraints
SET session_replication_role = replica;

-- Clear all content type tables
TRUNCATE TABLE
  attendances,
  spks,
  branches,
  vehicle_types,
  vehicle_groups,
  vehicle_types_group_lnk,
  articles_maintenances_lnk,
  articles_features_lnk,
  articles_categories_lnk,
  articles,
  authors,
  categories,
  abouts,
  globals
RESTART IDENTITY CASCADE;

-- Clear user permissions and roles
TRUNCATE TABLE
  up_users_role_lnk,
  up_users_supervisor_lnk,
  up_users,
  up_roles,
  up_permissions
RESTART IDENTITY CASCADE;

-- Clear upload files
TRUNCATE TABLE
  files_related_morphs,
  upload_file
RESTART IDENTITY CASCADE;

-- Clear Strapi core store (removes seed flags)
TRUNCATE TABLE
  core_store
RESTART IDENTITY CASCADE;

-- Re-enable constraints
SET session_replication_role = DEFAULT;

-- Update sequences (PostgreSQL specific)
SELECT setval('articles_id_seq', 1, false);
SELECT setval('authors_id_seq', 1, false);
SELECT setval('categories_id_seq', 1, false);
SELECT setval('attendances_id_seq', 1, false);
SELECT setval('spks_id_seq', 1, false);
SELECT setval('branches_id_seq', 1, false);
SELECT setval('vehicle_groups_id_seq', 1, false);
SELECT setval('vehicle_types_id_seq', 1, false);
SELECT setval('up_users_id_seq', 1, false);
SELECT setval('upload_file_id_seq', 1, false);
SELECT setval('core_store_id_seq', 1, false);
`);

  console.log('\nAfter running the SQL commands:');
  console.log('1. Restart Strapi: npm run develop');
  console.log('2. Go through the initial setup');
  console.log('3. Add your data manually from the admin panel');
}

// Also clean up any uploaded files
console.log('\n🧹 Cleaning up uploaded files...');
const uploadsDir = path.join(__dirname, '../public/uploads');
try {
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        // Remove directory recursively
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
    console.log('✅ Cleared public/uploads directory');
  }
} catch (error) {
  console.log('ℹ️  Could not clear uploads directory (may not exist)');
}

console.log('\n✅ All data has been cleared!');
console.log('Your Strapi instance is now ready for a fresh start.');