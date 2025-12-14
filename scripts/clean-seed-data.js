#!/usr/bin/env node

/**
 * Clean up seed data that was created without proper IDs
 * This script will remove all seeded data so it can be re-imported correctly
 */

const { Pool } = require('pg');

// Database configuration - adjust these values to match your environment
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5433,
  database: process.env.DATABASE_NAME || 'karuniamotor',
  user: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'yrkY!SKe5m2@kAkH5T9!'
};

async function cleanSeedData() {
  const pool = new Pool(dbConfig);
  const client = await pool.connect();

  try {
    console.log('🧹 Starting cleanup of seed data...\n');

    await client.query('BEGIN');

    // Disable foreign key constraints temporarily
    await client.query('SET session_replication_role = replica;');

    // Clean up in correct order (respecting foreign key dependencies)

    // 1. Clean up SPKs
    console.log('1. Removing SPKs...');
    const spkResult = await client.query('DELETE FROM spks WHERE id IS NOT NULL');
    console.log(`   ✓ Removed ${spkResult.rowCount} SPKs`);

    // 2. Clean up attendance records
    console.log('2. Removing attendance records...');
    const attendanceResult = await client.query('DELETE FROM attendances WHERE id IS NOT NULL');
    console.log(`   ✓ Removed ${attendanceResult.rowCount} attendance records`);

    // 3. Clean up users and their relations
    console.log('3. Removing user-role links...');
    await client.query('DELETE FROM up_users_role_lnk WHERE user_id IS NOT NULL');

    console.log('4. Removing user-supervisor links...');
    await client.query('DELETE FROM up_users_supervisor_lnk WHERE user_id IS NOT NULL');

    console.log('5. Removing users (except super admin)...');
    const userResult = await client.query("DELETE FROM up_users WHERE email != 'admin@karuniamotor.com'");
    console.log(`   ✓ Removed ${userResult.rowCount} users`);

    // 6. Clean up branches
    console.log('6. Removing branches...');
    const branchResult = await client.query('DELETE FROM branches WHERE id IS NOT NULL');
    console.log(`   ✓ Removed ${branchResult.rowCount} branches`);

    // 7. Clean up vehicle types and their relations
    console.log('7. Removing vehicle type-group links...');
    await client.query('DELETE FROM vehicle_types_group_lnk WHERE vehicle_type_id IS NOT NULL');

    console.log('8. Removing vehicle types...');
    const vehicleTypeResult = await client.query('DELETE FROM vehicle_types WHERE id IS NOT NULL');
    console.log(`   ✓ Removed ${vehicleTypeResult.rowCount} vehicle types`);

    // 8. Clean up vehicle groups
    console.log('9. Removing vehicle groups...');
    const vehicleGroupResult = await client.query('DELETE FROM vehicle_groups WHERE id IS NOT NULL');
    console.log(`   ✓ Removed ${vehicleGroupResult.rowCount} vehicle groups`);

    // 9. Clean up articles, categories, authors (if they exist from the original seed)
    console.log('10. Checking for articles...');
    const articleCheck = await client.query('SELECT COUNT(*) FROM articles');
    if (parseInt(articleCheck.rows[0].count) > 0) {
      console.log('   Found articles, cleaning up...');

      // Get all article IDs first
      const articles = await client.query('SELECT id FROM articles');

      // Clean up any article relations
      for (const article of articles.rows) {
        await client.query('DELETE FROM articles_maintenances_lnk WHERE article_id = $1', [article.id]);
        await client.query('DELETE FROM articles_features_lnk WHERE article_id = $1', [article.id]);
      }

      const articleResult = await client.query('DELETE FROM articles WHERE id IS NOT NULL');
      console.log(`   ✓ Removed ${articleResult.rowCount} articles`);
    }

    console.log('11. Checking for categories...');
    const categoryCheck = await client.query('SELECT COUNT(*) FROM categories');
    if (parseInt(categoryCheck.rows[0].count) > 0) {
      const categoryResult = await client.query('DELETE FROM categories WHERE id IS NOT NULL');
      console.log(`   ✓ Removed ${categoryResult.rowCount} categories`);
    }

    console.log('12. Checking for authors...');
    const authorCheck = await client.query('SELECT COUNT(*) FROM authors');
    if (parseInt(authorCheck.rows[0].count) > 0) {
      const authorResult = await client.query('DELETE FROM authors WHERE id IS NOT NULL');
      console.log(`   ✓ Removed ${authorResult.rowCount} authors`);
    }

    // Re-enable foreign key constraints
    await client.query('SET session_replication_role = DEFAULT;');

    // Reset the setup flag so seed can run again
    console.log('\n13. Resetting seed flags...');
    try {
      await client.query("DELETE FROM core_store WHERE key = 'plugin_content_type_builder_init'");
      await client.query("DELETE FROM core_store WHERE key = 'plugin_*_init'");
    } catch (e) {
      console.log('   Note: Could not reset seed flags (may not exist)');
    }

    await client.query('COMMIT');

    console.log('\n✅ Cleanup completed successfully!');
    console.log('\nYou can now run the proper seed script:');
    console.log('  npm run seed:fixed');
    console.log('or');
    console.log('  node scripts/seed-fixed.js');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the cleanup
cleanSeedData();