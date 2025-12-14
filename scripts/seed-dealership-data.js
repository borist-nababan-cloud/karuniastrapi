'use strict';

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const seedData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/seed-dealership-data.json'), 'utf8')
);

async function seedDatabase() {
  console.log('🌱 Starting database seeding for Karunia Motor Dealership System...\n');

  try {
    // 1. Seed Vehicle Groups
    console.log('1. Seeding Vehicle Groups...');
    const createdGroups = {};
    for (const group of seedData.vehicleGroups) {
      const existingGroup = await strapi.query('api::vehicle-group.vehicle-group').findOne({
        where: { name: group.name }
      });

      if (!existingGroup) {
        const created = await strapi.query('api::vehicle-group.vehicle-group').create({
          data: group
        });
        createdGroups[group.name] = created;
        console.log(`  ✓ Created: ${group.name}`);
      } else {
        createdGroups[group.name] = existingGroup;
        console.log(`  ✓ Exists: ${group.name}`);
      }
    }

    // 2. Seed Vehicle Types
    console.log('\n2. Seeding Vehicle Types...');
    const createdTypes = {};
    for (const type of seedData.vehicleTypes) {
      const existingType = await strapi.query('api::vehicle-type.vehicle-type').findOne({
        where: { name: type.name },
        populate: ['group']
      });

      if (!existingType) {
        const created = await strapi.query('api::vehicle-type.vehicle-type').create({
          data: {
            ...type,
            group: createdGroups[type.group].id
          }
        });
        createdTypes[type.name] = created;
        console.log(`  ✓ Created: ${type.name} (${type.group})`);
      } else {
        createdTypes[type.name] = existingType;
        console.log(`  ✓ Exists: ${type.name} (${type.group})`);
      }
    }

    // 3. Seed Branches
    console.log('\n3. Seeding Branches...');
    const createdBranches = {};
    for (const branch of seedData.branches) {
      const existingBranch = await strapi.query('api::branch.branch').findOne({
        where: { name: branch.name }
      });

      if (!existingBranch) {
        const created = await strapi.query('api::branch.branch').create({
          data: branch
        });
        createdBranches[branch.name] = created;
        console.log(`  ✓ Created: ${branch.name}`);
      } else {
        createdBranches[branch.name] = existingBranch;
        console.log(`  ✓ Exists: ${branch.name}`);
      }
    }

    // 4. Seed Users
    console.log('\n4. Seeding Users...');
    const createdUsers = {};
    const defaultRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' }
    });

    for (const user of seedData.users) {
      const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: user.email }
      });

      if (!existingUser) {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);

        const userData = {
          username: user.username,
          email: user.email,
          password: hashedPassword,
          fullName: user.fullName,
          phone: user.phone,
          whatsapp: user.whatsapp,
          role_custom: user.role_custom,
          isApproved: user.isApproved,
          lastLocation: user.lastLocation,
          role: defaultRole.id
        };

        // Add supervisor if exists
        if (user.supervisor && createdUsers[user.supervisor]) {
          userData.supervisor = createdUsers[user.supervisor].id;
        }

        const created = await strapi.query('plugin::users-permissions.user').create({
          data: userData
        });
        createdUsers[user.username] = created;
        console.log(`  ✓ Created: ${user.fullName} (${user.email}) - ${user.role_custom}`);
      } else {
        createdUsers[user.username] = existingUser;
        console.log(`  ✓ Exists: ${user.fullName} (${user.email}) - ${user.role_custom}`);
      }
    }

    // 5. Seed SPKs
    console.log('\n5. Seeding SPKs...');
    let spkCounter = 1;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const romanMonths = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

    for (const spk of seedData.spks) {
      const existingSpk = await strapi.query('api::spk.spk').findOne({
        where: {
          sales: createdUsers[spk.sales].id,
          branch: createdBranches[spk.branch].id,
          vehicleType: createdTypes[spk.vehicleType].id
        }
      });

      if (!existingSpk) {
        // Generate SPK number
        const spkNumber = `${String(spkCounter).padStart(3, '0')}/SPK/${romanMonths[currentMonth]}/${currentYear}`;
        spkCounter++;

        const spkData = {
          spkNumber: spkNumber,
          status: spk.status,
          isEditable: spk.status === 'ON PROGRESS',
          customerName: spk.customerName,
          customerPhone: spk.customerPhone,
          customerEmail: spk.customerEmail,
          notes: spk.notes,
          sales: createdUsers[spk.sales].id,
          branch: createdBranches[spk.branch].id,
          vehicleType: createdTypes[spk.vehicleType].id
        };

        const created = await strapi.query('api::spk.spk').create({
          data: spkData
        });
        console.log(`  ✓ Created: ${spkNumber} - ${spk.vehicleType} for ${spk.customerName}`);
      } else {
        console.log(`  ✓ Exists: SPK for ${spk.vehicleType} - ${spk.customerName}`);
      }
    }

    // 6. Seed Attendances
    console.log('\n6. Seeding Attendances...');
    for (const attendance of seedData.attendances) {
      const existingAttendance = await strapi.query('api::attendance.attendance').findOne({
        where: {
          user: createdUsers[attendance.user].id,
          timestamp: new Date(attendance.timestamp)
        }
      });

      if (!existingAttendance) {
        const created = await strapi.query('api::attendance.attendance').create({
          data: {
            timestamp: attendance.timestamp,
            type: attendance.type,
            coordinates: attendance.coordinates,
            user: createdUsers[attendance.user].id,
            branch: createdBranches[attendance.branch].id
          }
        });
        console.log(`  ✓ Created: ${attendance.user} - ${attendance.type} at ${attendance.timestamp}`);
      } else {
        console.log(`  ✓ Exists: ${attendance.user} - ${attendance.type} at ${attendance.timestamp}`);
      }
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`  - Vehicle Groups: ${seedData.vehicleGroups.length}`);
    console.log(`  - Vehicle Types: ${seedData.vehicleTypes.length}`);
    console.log(`  - Branches: ${seedData.branches.length}`);
    console.log(`  - Users: ${seedData.users.length}`);
    console.log(`  - SPKs: ${seedData.spks.length}`);
    console.log(`  - Attendances: ${seedData.attendances.length}`);

    console.log('\n🔑 Login credentials for test users:');
    console.log('\nAdmin:');
    console.log('  Email: admin@karuniamotor.com');
    console.log('  Password: Admin123!');

    console.log('\nSupervisors:');
    console.log('  Email: supervisor1@karuniamotor.com');
    console.log('  Password: Supervisor123!');
    console.log('  Email: supervisor2@karuniamotor.com');
    console.log('  Password: Supervisor123!');

    console.log('\nSales:');
    console.log('  Email: sales1@karuniamotor.com (Password: Sales123!)');
    console.log('  Email: sales2@karuniamotor.com (Password: Sales123!)');
    console.log('  Email: sales3@karuniamotor.com (Password: Sales123!)');
    console.log('  Email: sales4@karuniamotor.com (Password: Sales123!)');
    console.log('  Email: sales5@karuniamotor.com (Not approved - for testing)');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error(error.message);
    if (error.details) {
      console.error(error.details);
    }
  }
}

// Export for use in Strapi console
module.exports = seedDatabase;

// Run if called directly
if (require.main === module) {
  const { execSync } = require('child_process');

  // Check if Strapi is running
  try {
    execSync('curl http://localhost:1337/admin', { stdio: 'ignore' });
    console.log('❌ Please stop Strapi server before running seed script');
    console.log('   Run: npm run develop (stop with Ctrl+C)');
    process.exit(1);
  } catch (e) {
    // Server not running, we can proceed
  }

  console.log('Starting Strapi in seed mode...');
  process.env.NODE_ENV = 'development';
  require('../src/server').load().then(() => {
    console.log('Strapi loaded, seeding database...');
    seedDatabase().then(() => {
      console.log('Seeding complete, exiting...');
      process.exit(0);
    });
  });
}