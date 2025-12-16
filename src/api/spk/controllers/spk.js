'use strict';

/**
 * spk controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::spk.spk', ({ strapi }) => ({
  // Override default create method to use auto-generation
  async create(ctx) {
    // Get the SPK service
    const spkService = strapi.service('api::spk.spk');

    try {
      // Remove noSPK from request body if provided
      if (ctx.request.body.data && ctx.request.body.data.noSPK) {
        delete ctx.request.body.data.noSPK;
      }

      // Create SPK with auto-generated number
      const result = await spkService.createWithAutoNumber(ctx.request.body.data);

      // Send response
      ctx.status = 201;
      return result;
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        error: error.message
      };
    }
  }
}));