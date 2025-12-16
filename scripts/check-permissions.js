const { createStrapi, compileStrapi } = require('@strapi/strapi');

async function checkPermissions() {
  const appContext = await compileStrapi();
  const strapi = await createStrapi(appContext).load();

  strapi.log.level = 'error';

  try {
    console.log('\n=== Checking SPK Permissions in Database ===\n');

    // Get all permissions related to SPK
    const spkPermissions = await strapi.query('plugin::users-permissions.permission').findMany({
      where: {
        action: {
          $contains: 'spk'
        }
      }
    });

    console.log(`Found ${spkPermissions.length} SPK-related permissions:`);
    spkPermissions.forEach(p => {
      console.log(`  - ${p.action} (Role ID: ${p.role})`);
    });

    // Get all roles
    const roles = await strapi.query('plugin::users-permissions.role').findMany();
    console.log('\n=== Available Roles ===');
    roles.forEach(r => {
      console.log(`  - ${r.name} (ID: ${r.id}, Type: ${r.type})`);
    });

    // Check public role permissions specifically
    const publicRole = roles.find(r => r.type === 'public');
    if (publicRole) {
      const publicPermissions = await strapi.query('plugin::users-permissions.permission').findMany({
        where: {
          role: publicRole.id
        }
      });

      console.log(`\n=== Public Role (ID: ${publicRole.id}) Permissions ===`);
      const apiPermissions = publicPermissions.filter(p => p.action.startsWith('api::'));
      apiPermissions.forEach(p => {
        console.log(`  - ${p.action}`);
      });
    }

    // Check if SPK content-type is registered
    console.log('\n=== Checking SPK Content-Type Registration ===');
    const contentTypeService = strapi.plugin('content-type').service('content-types');
    const spkContentType = contentTypeService.find('api::spk.spk');

    if (spkContentType) {
      console.log('✅ SPK content-type is registered');
      console.log(`  - UID: ${spkContentType.uid}`);
      console.log(`  - Kind: ${spkContentType.kind}`);
    } else {
      console.log('❌ SPK content-type NOT found in registry');
    }

  } catch (error) {
    console.error('Error checking permissions:', error);
  } finally {
    await strapi.destroy();
  }
}

checkPermissions().catch((error) => {
  console.error(error);
  process.exit(1);
});