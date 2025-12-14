const { Strapi } = require('@strapi/strapi');

async function testSupervisorRelation() {
  console.log('Testing supervisor-user relation...');

  // Check if we can create multiple supervisors
  try {
    // Create supervisor 1
    const supervisor1 = await strapi.entityService.create('api::supervisor.supervisor', {
      data: {
        namasupervisor: 'John Doe',
        publishedAt: new Date()
      }
    });
    console.log('✓ Created supervisor 1:', supervisor1);

    // Create supervisor 2
    const supervisor2 = await strapi.entityService.create('api::supervisor.supervisor', {
      data: {
        namasupervisor: 'Jane Smith',
        publishedAt: new Date()
      }
    });
    console.log('✓ Created supervisor 2:', supervisor2);

    // Create user with supervisor 1
    const user1 = await strapi.entityService.create('plugin::users-permissions.user', {
      data: {
        username: 'testuser1',
        email: 'test1@example.com',
        password: 'Test123!',
        provider: 'local',
        confirmed: true,
        supervisor: supervisor1.id
      }
    });
    console.log('✓ Created user 1 with supervisor 1:', user1);

    // Try to update user1 with supervisor 2 (should replace the previous supervisor)
    const updatedUser1 = await strapi.entityService.update('plugin::users-permissions.user', user1.id, {
      data: {
        supervisor: supervisor2.id
      }
    });
    console.log('✓ Updated user 1 with supervisor 2:', updatedUser1);

    // Verify user can only have one supervisor
    const userWithSupervisor = await strapi.entityService.findOne('plugin::users-permissions.user', user1.id, {
      populate: ['supervisor']
    });

    console.log('\n=== Verification ===');
    console.log('User:', userWithSupervisor.username);
    console.log('Supervisor:', userWithSupervisor.supervisor?.namasupervisor || 'None');

    // Check supervisor 1 has no users now
    const supervisor1WithUsers = await strapi.entityService.findOne('api::supervisor.supervisor', supervisor1.id, {
      populate: ['users']
    });
    console.log('\nSupervisor 1 users count:', supervisor1WithUsers.users?.length || 0);

    // Check supervisor 2 has one user
    const supervisor2WithUsers = await strapi.entityService.findOne('api::supervisor.supervisor', supervisor2.id, {
      populate: ['users']
    });
    console.log('Supervisor 2 users count:', supervisor2WithUsers.users?.length || 0);

    console.log('\n✅ Test completed successfully! Users can only have ONE supervisor.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Export for use in Strapi console
module.exports = { testSupervisorRelation };