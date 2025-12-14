'use strict';

const fs = require('fs');
const path = require('path');

async function setupPermissions() {
  const { strapi } = global;

  // Define the permissions to set
  const permissions = [
    // Vehicle Groups
    {
      action: 'api::vehicle-group.vehicle-group.find',
      role: 'public'
    },
    {
      action: 'api::vehicle-group.vehicle-group.findOne',
      role: 'public'
    },
    {
      action: 'api::vehicle-group.vehicle-group.create',
      role: 'authenticated'
    },
    {
      action: 'api::vehicle-group.vehicle-group.update',
      role: 'authenticated'
    },
    {
      action: 'api::vehicle-group.vehicle-group.delete',
      role: 'authenticated'
    },

    // Vehicle Types
    {
      action: 'api::vehicle-type.vehicle-type.find',
      role: 'public'
    },
    {
      action: 'api::vehicle-type.vehicle-type.findOne',
      role: 'public'
    },
    {
      action: 'api::vehicle-type.vehicle-type.create',
      role: 'authenticated'
    },
    {
      action: 'api::vehicle-type.vehicle-type.update',
      role: 'authenticated'
    },
    {
      action: 'api::vehicle-type.vehicle-type.delete',
      role: 'authenticated'
    },

    // Branches
    {
      action: 'api::branch.branch.find',
      role: 'public'
    },
    {
      action: 'api::branch.branch.findOne',
      role: 'public'
    },
    {
      action: 'api::branch.branch.create',
      role: 'authenticated'
    },
    {
      action: 'api::branch.branch.update',
      role: 'authenticated'
    },
    {
      action: 'api::branch.branch.delete',
      role: 'authenticated'
    },

    // SPK
    {
      action: 'api::spk.spk.find',
      role: 'authenticated'
    },
    {
      action: 'api::spk.spk.findOne',
      role: 'authenticated'
    },
    {
      action: 'api::spk.spk.create',
      role: 'authenticated'
    },
    {
      action: 'api::spk.spk.update',
      role: 'authenticated'
    },
    {
      action: 'api::spk.spk.delete',
      role: 'authenticated'
    },

    // Attendance
    {
      action: 'api::attendance.attendance.find',
      role: 'authenticated'
    },
    {
      action: 'api::attendance.attendance.findOne',
      role: 'authenticated'
    },
    {
      action: 'api::attendance.attendance.create',
      role: 'authenticated'
    },
    {
      action: 'api::attendance.attendance.update',
      role: 'authenticated'
    },
    {
      action: 'api::attendance.attendance.delete',
      role: 'authenticated'
    },
    {
      action: 'api::attendance.attendance.findByUser',
      role: 'authenticated'
    },
    {
      action: 'api::attendance.attendance.findToday',
      role: 'authenticated'
    }
  ];

  // Get the roles
  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' }
  });

  const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: { type: 'authenticated' }
  });

  if (!publicRole || !authenticatedRole) {
    console.error('Could not find public or authenticated role');
    return;
  }

  console.log('Setting up permissions for dealership APIs...');

  for (const perm of permissions) {
    const role = perm.role === 'public' ? publicRole : authenticatedRole;

    // Check if permission already exists
    const existingPermission = await strapi.query('plugin::users-permissions.permission').findOne({
      where: {
        action: perm.action,
        role: role.id
      }
    });

    if (!existingPermission) {
      // Create new permission
      await strapi.query('plugin::users-permissions.permission').create({
        data: {
          action: perm.action,
          role: role.id
        }
      });
      console.log(`✓ Created permission: ${perm.action} for ${perm.role}`);
    } else {
      console.log(`- Permission already exists: ${perm.action} for ${perm.role}`);
    }
  }

  console.log('\n✅ Permissions setup complete!');
}

module.exports = setupPermissions;