'use strict';

module.exports = {
  beforeCreate: async (event) => {
    // Validate coordinates structure
    if (event.params.data.coordinates) {
      const coords = event.params.data.coordinates;
      if (!coords.latitude || !coords.longitude) {
        throw new Error('Coordinates must include latitude and longitude');
      }
    }

    // Auto-set timestamp if not provided
    if (!event.params.data.timestamp) {
      event.params.data.timestamp = new Date();
    }
  },

  afterCreate: async (event) => {
    // Log attendance creation
    const { type, user, timestamp } = event.result;
    console.log(`Attendance ${type} created for user ${user?.id} at ${timestamp}`);
  },

  beforeUpdate: async (event) => {
    // Prevent modifying attendance timestamp after creation
    if (event.params.data.timestamp) {
      throw new Error('Attendance timestamp cannot be modified');
    }
  },

  afterUpdate: async (event) => {
    // Add any post-update logic if needed
  },

  beforeDelete: async (event) => {
    // Add any pre-deletion logic if needed
  },

  afterDelete: async (event) => {
    // Log deletion
    console.log('Attendance deleted for user:', event.result.user?.id);
  }
};