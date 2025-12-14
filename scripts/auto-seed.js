'use strict';

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

module.exports = async ({ strapi }) => {
  // Check if seeding has been done before
  const seedingDone = await strapi.query('admin::user').findOne({
    where: { email: 'admin@karuniamotor.com' }
  });

  if (seedingDone) {
    console.log('📊 Dealership data already seeded. Skipping...');
    return;
  }

  console.log('🌱 Starting automatic database seeding for Karunia Motor...');

  // Read seed data
  const seedData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/seed-dealership-data.json'), 'utf8')
  );

  try {
    // 1. Seed Vehicle Groups
    console.log('Creating Vehicle Groups...');
    const createdGroups = {};
    for (const group of seedData.vehicleGroups) {
      const created = await strapi.query('api::vehicle-group.vehicle-group').create({
        data: group
      });
      createdGroups[group.name] = created;
    }

    // 2. Seed Vehicle Types
    console.log('Creating Vehicle Types...');
    const createdTypes = {};
    for (const type of seedData.vehicleTypes) {
      const created = await strapi.query('api::vehicle-type.vehicle-type').create({
        data: {
          ...type,
          group: createdGroups[type.group].id
        }
      });
      createdTypes[type.name] = created;
    }

    // 3. Seed Branches
    console.log('Creating Branches...');
    const createdBranches = {};
    for (const branch of seedData.branches) {
      const created = await strapi.query('api::branch.branch').create({
        data: branch
      });
      createdBranches[branch.name] = created;
    }

    // 4. Seed Users
    console.log('Creating Users...');
    const createdUsers = {};
    const defaultRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' }
    });

    // Create users in order to handle supervisor relationships
    const orderedUsers = seedData.users.sort((a, b) => {
      if (a.username === 'admin') return -1;
      if (b.username === 'admin') return 1;
      if (a.role_custom === 'SPV' && b.role_custom === 'SALES') return -1;
      if (a.role_custom === 'SALES' && b.role_custom === 'SPV') return 1;
      return 0;
    });

    for (const user of orderedUsers) {
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

      // Add supervisor if exists and already created
      if (user.supervisor && createdUsers[user.supervisor]) {
        userData.supervisor = createdUsers[user.supervisor].id;
      }

      const created = await strapi.query('plugin::users-permissions.user').create({
        data: userData
      });
      createdUsers[user.username] = created;
    }

    // 5. Seed SPKs
    console.log('Creating SPKs...');
    let spkCounter = 1;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const romanMonths = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

    for (const spk of seedData.spks) {
      const spkNumber = `${String(spkCounter).padStart(3, '0')}/SPK/${romanMonths[currentMonth]}/${currentYear}`;
      spkCounter++;

      await strapi.query('api::spk.spk').create({
        data: {
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
        }
      });
    }

    // 6. Seed Attendances
    console.log('Creating Attendances...');
    for (const attendance of seedData.attendances) {
      await strapi.query('api::attendance.attendance').create({
        data: {
          timestamp: attendance.timestamp,
          type: attendance.type,
          coordinates: attendance.coordinates,
          user: createdUsers[attendance.user].id,
          branch: createdBranches[attendance.branch].id
        }
      });
    }

    console.log('✅ Dealership data seeded successfully!');
    console.log('\n🔑 Login credentials:');
    console.log('  Admin: admin@karuniamotor.com / Admin123!');
    console.log('  Supervisor: supervisor1@karuniamotor.com / Supervisor123!');
    console.log('  Sales: sales1@karuniamotor.com / Sales123!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};