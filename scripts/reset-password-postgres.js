const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database configuration - update these if needed
const dbConfig = {
  host: 'localhost',
  port: 5433,
  database: 'karuniamotor',
  user: 'postgres',
  password: 'yrkY!SKe5m2@kAkH5T9!'
};

async function resetPassword() {
  const pool = new Pool(dbConfig);
  const client = await pool.connect();

  try {
    const email = 'borist@nababancloud.net';
    const newPassword = 'NewPassword123!'; // Change this to your desired password

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    console.log('Resetting password for:', email);

    // Check if user exists
    const checkUser = await client.query(
      'SELECT id, email FROM admin_users WHERE email = $1',
      [email]
    );

    if (checkUser.rows.length === 0) {
      console.log('❌ Admin user not found with email:', email);
      console.log('\nAvailable admin users:');
      const allUsers = await client.query('SELECT id, email FROM admin_users');
      allUsers.rows.forEach(user => {
        console.log(`- ${user.email} (ID: ${user.id})`);
      });
      return;
    }

    // Update the password
    const result = await client.query(
      'UPDATE admin_users SET password = $1 WHERE email = $2 RETURNING id, email',
      [hashedPassword, email]
    );

    console.log('✅ Password reset successfully!');
    console.log('Email:', email);
    console.log('New Password:', newPassword);
    console.log('\n⚠️  Please change this password after logging in for security.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nIf you get a connection error, please check:');
    console.log('1. PostgreSQL is running');
    console.log('2. Database credentials in your .env file');
    console.log('3. Database name and user permissions');
  } finally {
    client.release();
    await pool.end();
  }
}

resetPassword();