#!/usr/bin/env node

const { execSync } = require('child_process');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Database configuration from .env
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

async function checkIfSeeded() {
  const pool = new Pool(dbConfig);
  const client = await pool.connect();

  try {
    const result = await client.query(
      'SELECT id FROM admin_users WHERE email = $1 LIMIT 1',
      ['admin@karuniamotor.com']
    );
    return result.rows.length > 0;
  } finally {
    client.release();
    await pool.end();
  }
}

async function directSeed() {
  console.log('🌱 Directly seeding database...');

  const pool = new Pool(dbConfig);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Insert Vehicle Groups
    console.log('1. Creating Vehicle Groups...');
    for (const group of seedData.vehicleGroups) {
      const existing = await client.query(
        'SELECT id FROM vehicle_groups WHERE name = $1',
        [group.name]
      );

      if (existing.rows.length === 0) {
        const result = await client.query(
          'INSERT INTO vehicle_groups (name, created_at, updated_at, published_at) VALUES ($1, NOW(), NOW(), NOW()) RETURNING id',
          [group.name]
        );
        group._id = result.rows[0].id;
        console.log(`  ✓ Created: ${group.name}`);
      } else {
        group._id = existing.rows[0].id;
        console.log(`  ✓ Exists: ${group.name}`);
      }
    }

    // 2. Insert Vehicle Types
    console.log('\n2. Creating Vehicle Types...');
    for (const type of seedData.vehicleTypes) {
      const existing = await client.query(
        'SELECT id FROM vehicle_types WHERE name = $1',
        [type.name]
      );

      if (existing.rows.length === 0) {
        const groupId = seedData.vehicleGroups.find(g => g.name === type.group)._id;
        const result = await client.query(
          'INSERT INTO vehicle_types (name, "group", created_at, updated_at, published_at) VALUES ($1, $2, NOW(), NOW(), NOW()) RETURNING id',
          [type.name, groupId]
        );
        type._id = result.rows[0].id;
        console.log(`  ✓ Created: ${type.name} (${type.group})`);
      } else {
        type._id = existing.rows[0].id;
        console.log(`  ✓ Exists: ${type.name} (${type.group})`);
      }
    }

    // 3. Insert Branches
    console.log('\n3. Creating Branches...');
    for (const branch of seedData.branches) {
      const existing = await client.query(
        'SELECT id FROM branches WHERE name = $1',
        [branch.name]
      );

      if (existing.rows.length === 0) {
        const result = await client.query(
          'INSERT INTO branches (name, address, latitude, longitude, created_at, updated_at, published_at) VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW()) RETURNING id',
          [branch.name, branch.address, branch.latitude, branch.longitude]
        );
        branch._id = result.rows[0].id;
        console.log(`  ✓ Created: ${branch.name}`);
      } else {
        branch._id = existing.rows[0].id;
        console.log(`  ✓ Exists: ${branch.name}`);
      }
    }

    // 4. Get or create the authenticated role
    const roleResult = await client.query(
      'SELECT id FROM up_roles WHERE type = $1 LIMIT 1',
      ['authenticated']
    );
    const authenticatedRoleId = roleResult.rows[0]?.id;

    // 5. Insert Users
    console.log('\n4. Creating Users...');
    const createdUsers = {};

    // Sort users to handle supervisor relationships
    const orderedUsers = seedData.users.sort((a, b) => {
      if (a.username === 'admin') return -1;
      if (b.username === 'admin') return 1;
      if (a.role_custom === 'SPV' && b.role_custom === 'SALES') return -1;
      if (a.role_custom === 'SALES' && b.role_custom === 'SPV') return 1;
      return 0;
    });

    for (const user of orderedUsers) {
      const existing = await client.query(
        'SELECT id FROM up_users WHERE email = $1',
        [user.email]
      );

      if (existing.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        let supervisorId = null;
        if (user.supervisor && createdUsers[user.supervisor]) {
          supervisorId = createdUsers[user.supervisor];
        }

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
            authenticatedRoleId
          ]
        );

        createdUsers[user.username] = result.rows[0].id;
        console.log(`  ✓ Created: ${user.fullName} (${user.email}) - ${user.role_custom}`);
      } else {
        createdUsers[user.username] = existing.rows[0].id;
        console.log(`  ✓ Exists: ${user.fullName} (${user.email}) - ${user.role_custom}`);
      }
    }

    // 6. Insert SPKs
    console.log('\n5. Creating SPKs...');
    let spkCounter = 1;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const romanMonths = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

    for (const spk of seedData.spks) {
      const existing = await client.query(
        'SELECT id FROM spks WHERE sales = $1 AND branch = $2 AND "vehicleType" = $3 LIMIT 1',
        [createdUsers[spk.sales], seedData.branches.find(b => b.name === spk.branch)._id, seedData.vehicleTypes.find(t => t.name === spk.vehicleType)._id]
      );

      if (existing.rows.length === 0) {
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
            createdUsers[spk.sales],
            seedData.branches.find(b => b.name === spk.branch)._id,
            seedData.vehicleTypes.find(t => t.name === spk.vehicleType)._id
          ]
        );
        console.log(`  ✓ Created: ${spkNumber} - ${spk.vehicleType} for ${spk.customerName}`);
      } else {
        console.log(`  ✓ Exists: SPK for ${spk.vehicleType} - ${spk.customerName}`);
      }
    }

    // 7. Insert Attendances
    console.log('\n6. Creating Attendances...');
    for (const attendance of seedData.attendances) {
      const existing = await client.query(
        'SELECT id FROM attendances WHERE "user" = $1 AND timestamp = $2 LIMIT 1',
        [createdUsers[attendance.user], attendance.timestamp]
      );

      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO attendances (
            timestamp, type, coordinates, "user", branch,
            created_at, updated_at, published_at
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())`,
          [
            attendance.timestamp,
            attendance.type,
            JSON.stringify(attendance.coordinates),
            createdUsers[attendance.user],
            seedData.branches.find(b => b.name === attendance.branch)._id
          ]
        );
        console.log(`  ✓ Created: ${attendance.user} - ${attendance.type} at ${attendance.timestamp}`);
      } else {
        console.log(`  ✓ Exists: ${attendance.user} - ${attendance.type} at ${attendance.timestamp}`);
      }
    }

    await client.query('COMMIT');
    console.log('\n✅ Database seeded successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  try {
    // Check if already seeded
    const isSeeded = await checkIfSeeded();
    if (isSeeded) {
      console.log('📊 Database already seeded. Use --force to reseed.');
      return;
    }

    await directSeed();

    console.log('\n🔑 Login credentials:');
    console.log('  Admin: admin@karuniamotor.com / Admin123!');
    console.log('  Supervisor: supervisor1@karuniamotor.com / Supervisor123!');
    console.log('  Sales: sales1@karuniamotor.com / Sales123!');

  } catch (error) {
    console.error('❌ Failed to seed database:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  const force = process.argv.includes('--force');
  if (force) {
    console.log('⚠️  Force reseed requested - this will not check existing data');
  }
  main();
}