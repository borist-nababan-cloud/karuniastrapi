'use strict';

const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  const email = 'borist@nababancloud.net';
  const newPassword = 'NewPassword123!'; // You can change this

  console.log('Resetting password for:', email);

  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  try {
    // Update the admin user password directly in the database
    const adminUser = await strapi.query('admin::user').findOne({
      where: { email: email }
    });

    if (!adminUser) {
      console.log('Admin user not found with email:', email);
      return;
    }

    await strapi.query('admin::user').update({
      where: { id: adminUser.id },
      data: {
        password: hashedPassword
      }
    });

    console.log('✅ Password reset successfully!');
    console.log('Email:', email);
    console.log('New Password:', newPassword);
    console.log('\nPlease change this password after logging in for security.');

  } catch (error) {
    console.error('Error resetting password:', error);
  }
}

// Export to run in console
module.exports = resetAdminPassword;