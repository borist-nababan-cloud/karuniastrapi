/**
 * Run this script in Strapi console to clear all data
 * Usage: npm run console
 * Then paste: require('./scripts/clear-data-console.js')
 */

module.exports = async () => {
  console.log('🧹 Starting to clear all data...');

  try {
    // Get all content types
    const contentTypes = strapi.contentTypes;

    for (const [uid, contentType] of Object.entries(contentTypes)) {
      // Skip core Strapi types
      if (uid.includes('strapi') || uid.includes('plugin')) continue;

      console.log(`Clearing ${uid}...`);

      try {
        // Delete all entries for this content type
        const entries = await strapi.documents(uid).findMany();
        if (entries.length > 0) {
          for (const entry of entries) {
            try {
              await strapi.documents(uid).delete({ documentId: entry.documentId });
            } catch (e) {
              // Try with ID instead
              try {
                await strapi.documents(uid).delete({ documentId: entry.id });
              } catch (e2) {
                console.log(`  ⚠️  Could not delete entry: ${entry.id || entry.documentId}`);
              }
            }
          }
          console.log(`  ✓ Deleted ${entries.length} entries`);
        }
      } catch (error) {
        console.log(`  ⚠️  Could not clear ${uid}: ${error.message}`);
      }
    }

    // Clear upload files
    console.log('Clearing uploaded files...');
    try {
      const files = await strapi.plugin('upload').service('upload').findMany();
      for (const file of files) {
        try {
          await strapi.plugin('upload').service('upload').delete(file);
        } catch (e) {
          console.log(`  ⚠️  Could not delete file: ${file.name}`);
        }
      }
      console.log(`  ✓ Cleared files`);
    } catch (error) {
      console.log(`  ⚠️  Could not clear files: ${error.message}`);
    }

    // Reset the setup store
    console.log('Resetting setup flags...');
    try {
      const pluginStore = strapi.store({
        environment: strapi.config.environment,
        type: 'type',
        name: 'setup'
      });
      await pluginStore.set({ key: 'initHasRun', value: false });
      console.log('  ✓ Reset setup flags');
    } catch (error) {
      console.log(`  ⚠️  Could not reset flags: ${error.message}`);
    }

    console.log('\n✅ Data clearing completed!');
    console.log('Please restart Strapi to apply all changes.');
    console.log('Run: npm run develop');

  } catch (error) {
    console.error('\n❌ Error clearing data:', error);
  }
};