#!/usr/bin/env node

/**
 * Fix entries with null IDs in the database
 * Run this in Strapi console if you're still having delete/edit issues
 */

module.exports = async () => {
  console.log('🔧 Fixing entries with null IDs...');

  try {
    // List all content types to check
    const contentTypes = [
      'api::article.article',
      'api::author.author',
      'api::category.category',
      'api::about.about',
      'api::global.global',
      'api::attendance.attendance',
      'api::spk.spk',
      'api::branch.branch',
      'api::vehicle-group.vehicle-group',
      'api::vehicle-type.vehicle-type'
    ];

    for (const contentType of contentTypes) {
      try {
        // Try to find all entries
        const entries = await strapi.documents(contentType).findMany({
          fields: ['id', 'documentId']
        });

        if (entries.length > 0) {
          console.log(`\nChecking ${contentType}:`);

          for (const entry of entries) {
            // Check if the entry has invalid/null IDs
            if (!entry.id || !entry.documentId || entry.documentId === 'null' || entry.id === null) {
              console.log(`  ⚠️  Found invalid entry: ${JSON.stringify(entry)}`);

              // Try to delete the problematic entry
              try {
                await strapi.documents(contentType).delete({
                  documentId: entry.documentId
                });
                console.log(`  ✅ Deleted problematic entry`);
              } catch (e) {
                console.log(`  ❌ Could not delete entry: ${e.message}`);
              }
            }
          }
        }
      } catch (error) {
        console.log(`  ⚠️  Could not check ${contentType}: ${error.message}`);
      }
    }

    console.log('\n✅ Fix completed!');
    console.log('If you still have issues, run: npm run db:reset');

  } catch (error) {
    console.error('\n❌ Error fixing null IDs:', error);
  }
};