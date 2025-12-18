const { createStrapi, compileStrapi } = require('@strapi/strapi');

async function setPublicPermissions() {
  const appContext = await compileStrapi();
  const strapi = await createStrapi(appContext).load();

  strapi.log.level = 'error';

  try {
    // Find the ID of the public role
    const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: {
        type: 'public',
      },
    });

    if (!publicRole) {
      console.error('Public role not found');
      return;
    }

    console.log('Found public role:', publicRole.id);

    // Permissions to set for each collection
    const permissions = {
      article: ['find', 'findOne'],
      category: ['find', 'findOne'],
      author: ['find', 'findOne'],
      global: ['find', 'findOne'],
      about: ['find', 'findOne'],
      branch: ['find', 'findOne'],
      supervisor: ['find', 'findOne'],
      spk: ['find', 'findOne', 'create', 'update', 'delete'],
      'vehicle-group': ['find', 'findOne'],
      'vehicle-type': ['find', 'findOne'],
      attendance: ['find', 'findOne'],
      color: ['find', 'findOne'],
    };

    // Create the new permissions and link them to the public role
    for (const [controller, actions] of Object.entries(permissions)) {
      for (const action of actions) {
        try {
          await strapi.query('plugin::users-permissions.permission').create({
            data: {
              action: `api::${controller}.${controller}.${action}`,
              role: publicRole.id,
            },
          });
          console.log(`✅ Created permission: ${controller}.${action}`);
        } catch (error) {
          console.error(`❌ Failed to create permission ${controller}.${action}:`, error.message);
        }
      }
    }

    console.log('✅ Public permissions set successfully');
  } catch (error) {
    console.error('Error setting permissions:', error);
  } finally {
    await strapi.destroy();
  }
}

setPublicPermissions().catch((error) => {
  console.error(error);
  process.exit(1);
});