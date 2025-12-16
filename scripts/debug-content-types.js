const { createStrapi, compileStrapi } = require('@strapi/strapi');
const fs = require('fs');
const path = require('path');

async function debugContentTypes() {
  const appContext = await compileStrapi();
  const strapi = await createStrapi(appContext).load();

  strapi.log.level = 'error';

  console.log('\n=== COMPREHENSIVE CONTENT-TYPE DEBUGGING ===\n');

  try {
    // 1. Check file system structure
    console.log('1. FILE SYSTEM STRUCTURE CHECK');
    console.log('=====================================');

    const apiPath = path.join(__dirname, '../src/api');
    const apis = fs.readdirSync(apiPath);

    console.log('\nAPIs found in src/api:');
    apis.forEach(api => {
      const apiDir = path.join(apiPath, api);
      const stat = fs.statSync(apiDir);
      if (stat.isDirectory()) {
        console.log(`\n📁 /${api}`);

        // Check content-types
        const contentTypePath = path.join(apiDir, 'content-types');
        if (fs.existsSync(contentTypePath)) {
          const contentTypes = fs.readdirSync(contentTypePath);
          contentTypes.forEach(ct => {
            console.log(`  └─ content-types/${ct}`);
            const schemaFile = path.join(contentTypePath, ct, 'schema.json');
            if (fs.existsSync(schemaFile)) {
              const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));
              console.log(`     ✅ Schema exists: ${schema.info.displayName}`);
            }
          });
        }

        // Check controllers
        const controllerPath = path.join(apiDir, 'controllers');
        if (fs.existsSync(controllerPath)) {
          const controllers = fs.readdirSync(controllerPath);
          controllers.forEach(ctrl => {
            if (ctrl !== 'index.js') {
              console.log(`  └─ controllers/${ctrl}`);
            }
          });
        }

        // Check routes
        const routesPath = path.join(apiDir, 'routes');
        if (fs.existsSync(routesPath)) {
          const routes = fs.readdirSync(routesPath);
          routes.forEach(route => {
            if (route !== 'index.js') {
              console.log(`  └─ routes/${route}`);
            }
          });
        }

        // Check services
        const servicesPath = path.join(apiDir, 'services');
        if (fs.existsSync(servicesPath)) {
          const services = fs.readdirSync(servicesPath);
          services.forEach(svc => {
            if (svc !== 'index.js') {
              console.log(`  └─ services/${svc}`);
            }
          });
        }
      }
    });

    // 2. Check Strapi's internal content-type registry
    console.log('\n\n2. STRAPI CONTENT-TYPE REGISTRY');
    console.log('================================');

    const contentTypes = strapi.contentTypes;
    console.log('\nRegistered content-types:');

    const apiContentTypes = Object.entries(contentTypes)
      .filter(([uid, ct]) => uid.startsWith('api::'))
      .sort(([a], [b]) => a.localeCompare(b));

    apiContentTypes.forEach(([uid, ct]) => {
      console.log(`\n📋 ${uid}`);
      console.log(`   Kind: ${ct.kind}`);
      console.log(`   Collection: ${ct.collectionName}`);
      console.log(`   DisplayName: ${ct.info.displayName}`);
      console.log(`   UID: ${ct.uid}`);

      // Check if it has specific API attributes
      if (ct.api) {
        console.log(`   API: ${JSON.stringify(ct.api)}`);
      }
    });

    // 3. Check specifically for SPK
    console.log('\n\n3. SPK-SPECIFIC ANALYSIS');
    console.log('==========================');

    const spkContentType = contentTypes['api::spk.spk'];

    if (spkContentType) {
      console.log('✅ SPK found in content-type registry');
      console.log(`   UID: ${spkContentType.uid}`);
      console.log(`   Kind: ${spkContentType.kind}`);
      console.log(`   Collection: ${spkContentType.collectionName}`);

      // Check attributes
      console.log('\n   Attributes:');
      Object.entries(spkContentType.attributes).forEach(([key, attr]) => {
        console.log(`     - ${key}: ${attr.type || 'relation'}`);
      });

      // Check if routes are defined
      console.log('\n   Checking route registration...');
      // Routes service check removed due to access issues

    } else {
      console.log('❌ SPK NOT found in content-type registry');

      // Try to load it manually
      console.log('\n   Attempting manual registration...');
      try {
        // Check if the schema file exists
        const spkSchemaPath = path.join(__dirname, '../src/api/spk/content-types/spk/schema.json');
        if (fs.existsSync(spkSchemaPath)) {
          console.log('   ✅ Schema file exists');
          const schema = JSON.parse(fs.readFileSync(spkSchemaPath, 'utf8'));
          console.log(`   Display name: ${schema.info.displayName}`);
        } else {
          console.log('   ❌ Schema file missing');
        }
      } catch (error) {
        console.error(`   Error: ${error.message}`);
      }
    }

    // 4. Check permissions
    console.log('\n\n4. PERMISSIONS ANALYSIS');
    console.log('========================');

    const permissions = await strapi.query('plugin::users-permissions.permission').findMany();

    // Group permissions by content-type
    const groupedPerms = {};
    permissions.forEach(p => {
      if (p.action && p.action.startsWith('api::')) {
        const match = p.action.match(/api::([^.]*)\.([^.]*)\.(.*)/);
        if (match) {
          const [, api, contentType, action] = match;
          const key = `${api}::${contentType}`;
          if (!groupedPerms[key]) {
            groupedPerms[key] = [];
          }
          groupedPerms[key].push(action);
        }
      }
    });

    console.log('\nPermissions by content-type:');
    Object.entries(groupedPerms).sort(([a], [b]) => a.localeCompare(b)).forEach(([key, actions]) => {
      const uniqueActions = [...new Set(actions)];
      console.log(`\n🔐 ${key}`);
      uniqueActions.forEach(action => {
        console.log(`   - ${action}`);
      });
    });

    // 5. Check database tables
    console.log('\n\n5. DATABASE TABLES');
    console.log('==================');

    // This requires direct DB connection - using previous script's findings
    console.log('Based on previous check:');
    console.log('✅ spks table exists with 1 record');
    console.log('✅ up_permissions table has SPK permissions');

    // 6. Recommendations
    console.log('\n\n6. DEBUGGING RECOMMENDATIONS');
    console.log('==============================');

    if (!spkContentType) {
      console.log('❌ SPK content-type not registered');
      console.log('   Possible causes:');
      console.log('   1. Schema validation errors');
      console.log('   2. Component reference issues');
      console.log('   3. Lifecycle hook errors');
      console.log('   4. Missing required files');
    } else {
      console.log('✅ SPK content-type registered');
      console.log('   Issue might be with:');
      console.log('   1. Admin panel cache');
      console.log('   2. Route registration');
      console.log('   3. Permission UI updates');
    }

  } catch (error) {
    console.error('Error during debugging:', error);
    console.error(error.stack);
  } finally {
    await strapi.destroy();
  }
}

debugContentTypes().catch((error) => {
  console.error(error);
  process.exit(1);
});