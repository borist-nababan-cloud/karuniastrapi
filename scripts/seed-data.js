#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 5433,
  database: 'karuniamotor',
  user: 'postgres',
  password: 'yrkY!SKe5m2@kAkH5T9!'
};

const seedData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/seed-dealership-data.json'), 'utf8')
);

async function seedViaDatabase() {
  const pool = new Pool(dbConfig);
  const client = await pool.connect();

  try {
    console.log('🌱 Starting database seeding...\n');

    await client.query('BEGIN');

    // 1. Check if admin user already exists
    const adminExists = await client.query(
      'SELECT id FROM up_users WHERE email = $1 LIMIT 1',
      ['admin@karuniamotor.com']
    );

    if (adminExists.rows.length > 0) {
      console.log('📊 Data already seeded! Skipping...');
      console.log('\n🔑 Login credentials:');
      console.log('  Admin: admin@karuniamotor.com / Admin123!');
      console.log('  Supervisor: supervisor1@karuniamotor.com / Supervisor123!');
      console.log('  Sales: sales1@karuniamotor.com / Sales123!');
      return;
    }

    // 2. Create Vehicle Groups
    console.log('1. Creating Vehicle Groups...');
    for (const group of seedData.vehicleGroups) {
      const result = await client.query(
        'INSERT INTO vehicle_groups (name, created_at, updated_at, published_at) VALUES ($1, NOW(), NOW(), NOW()) RETURNING id',
        [group.name]
      );
      group._dbId = result.rows[0].id;
      console.log(`  ✓ Created: ${group.name}`);
    }

    // 3. Create Vehicle Types
    console.log('\n2. Creating Vehicle Types...');
    for (const type of seedData.vehicleTypes) {
      const groupId = seedData.vehicleGroups.find(g => g.name === type.group)._dbId;
      const result = await client.query(
        'INSERT INTO vehicle_types (name, "group", created_at, updated_at, published_at) VALUES ($1, $2, NOW(), NOW(), NOW()) RETURNING id',
        [type.name, groupId]
      );
      type._dbId = result.rows[0].id;
      console.log(`  ✓ Created: ${type.name}`);
    }

    // 4. Create Branches
    console.log('\n3. Creating Branches...');
    for (const branch of seedData.branches) {
      const result = await client.query(
        'INSERT INTO branches (name, address, latitude, longitude, created_at, updated_at, published_at) VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW()) RETURNING id',
        [branch.name, branch.address, branch.latitude, branch.longitude]
      );
      branch._dbId = result.rows[0].id;
      console.log(`  ✓ Created: ${branch.name}`);
    }

    // 5. Get authenticated role
    const roleResult = await client.query(
      'SELECT id FROM up_roles WHERE type = $1 LIMIT 1',
      ['authenticated']
    );
    const roleId = roleResult.rows[0]?.id;

    // 6. Create Users
    console.log('\n4. Creating Users...');
    const usersMap = {};
    const orderedUsers = [...seedData.users].sort((a, b) => {
      if (a.username === 'admin') return -1;
      if (b.username === 'admin') return 1;
      if (a.role_custom === 'SPV' && b.role_custom === 'SALES') return -1;
      if (a.role_custom === 'SALES' && b.role_custom === 'SPV') return 1;
      return 0;
    });

    for (const user of orderedUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const supervisorId = user.supervisor ? usersMap[user.supervisor] : null;

      const result = await client.query(
        `INSERT INTO up_users (
          username, email, password, full_name, phone, whatsapp,
          role_custom, is_approved, last_location, role_id,
          confirmed, blocked, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, false, NOW(), NOW())
        RETURNING id`,
        [
          user.username,
          user.email,
          hashedPassword,
          user.fullName,
          user.phone,
          user.whatsapp,
          user.role_custom,
          user.isApproved,
          JSON.stringify(user.lastLocation),
          roleId
        ]
      );

      usersMap[user.username] = result.rows[0].id;
      console.log(`  ✓ Created: ${user.fullName} (${user.email})`);
    }

    // 7. Create SPKs
    console.log('\n5. Creating SPKs...');
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const romanMonths = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    let spkCounter = 1;

    for (const spk of seedData.spks) {
      const spkNumber = `${String(spkCounter).padStart(3, '0')}/SPK/${romanMonths[currentMonth]}/${currentYear}`;
      spkCounter++;

      await client.query(
        `INSERT INTO spks (
          "spkNumber", status, "isEditable", "customerName", "customerPhone",
          "customerEmail", notes, sales, branch, "vehicleType",
          created_at, updated_at, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW())`,
        [
          spkNumber,
          spk.status,
          spk.status === 'ON PROGRESS',
          spk.customerName,
          spk.customerPhone,
          spk.customerEmail,
          spk.notes,
          usersMap[spk.sales],
          seedData.branches.find(b => b.name === spk.branch)._dbId,
          seedData.vehicleTypes.find(t => t.name === spk.vehicleType)._dbId
        ]
      );
      console.log(`  ✓ Created: ${spkNumber} - ${spk.vehicleType}`);
    }

    // 8. Create Attendances
    console.log('\n6. Creating Attendances...');
    for (const attendance of seedData.attendances) {
      await client.query(
        `INSERT INTO attendances (
          timestamp, type, coordinates, "user", branch,
          created_at, updated_at, published_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())`,
        [
          attendance.timestamp,
          attendance.type,
          JSON.stringify(attendance.coordinates),
          usersMap[attendance.user],
          seedData.branches.find(b => b.name === attendance.branch)._dbId
        ]
      );
      console.log(`  ✓ Created: ${attendance.user} - ${attendance.type}`);
    }

    await client.query('COMMIT');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - Vehicle Groups: ${seedData.vehicleGroups.length}`);
    console.log(`  - Vehicle Types: ${seedData.vehicleTypes.length}`);
    console.log(`  - Branches: ${seedData.branches.length}`);
    console.log(`  - Users: ${seedData.users.length}`);
    console.log(`  - SPKs: ${seedData.spks.length}`);
    console.log(`  - Attendances: ${seedData.attendances.length}`);

    console.log('\n🔑 Login credentials:');
    console.log('  Admin: admin@karuniamotor.com / Admin123!');
    console.log('  Supervisor: supervisor1@karuniamotor.com / Supervisor123!');
    console.log('  Sales: sales1@karuniamotor.com / Sales123!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedViaDatabase().catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
}