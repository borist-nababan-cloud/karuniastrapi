'use strict';

module.exports = {
  // Lifecycle hook before creating a new SPK
  beforeCreate: async (event) => {
    // Get the SPK service
    const spkService = strapi.service('api::spk.spk');

    // Auto-generate SPK number if not provided
    if (!event.params.data.noSPK) {
      const spkNumber = await spkService.generateSPKNumber();
      event.params.data.noSPK = spkNumber;

    }
  },

  // Lifecycle hook after creating a new SPK
  afterCreate: async (event) => {
    // Log successful creation
    if (event.result && event.result.noSPK) {

    }
  },

  // Lifecycle hook before updating an SPK
  beforeUpdate: async (event) => {
    // Prevent SPK number modification after creation
    if (event.params.data.noSPK && event.result && event.result.noSPK) {
      // If trying to change the noSPK, block it
      if (event.params.data.noSPK !== event.result.noSPK) {
        throw new Error('SPK number cannot be modified after creation');
      }
    }
  },

  // Lifecycle hook after updating an SPK
  afterUpdate: async (event) => {
    // Log successful update
    if (event.result && event.result.noSPK) {

    }
  },

  // Lifecycle hook before deleting an SPK
  beforeDelete: async (event) => {
    // Add any pre-deletion logic if needed

  },

  // Lifecycle hook after deleting an SPK
  afterDelete: async (event) => {
    // Log deletion
    if (event.result && event.result.noSPK) {

    }
  }
};