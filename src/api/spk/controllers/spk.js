'use strict';

/**
 * spk controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::spk.spk', ({ strapi }) => ({
  // Override create method to handle auto-numbering
  async create(ctx) {
    try {
      const response = await super.create(ctx);
      return response;
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        error: error.message,
        details: 'Failed to create SPK'
      };
    }
  },

  // Override update method to handle edit restrictions
  async update(ctx) {
    try {
      const { id } = ctx.params;
      const existingSpk = await strapi.query('api::spk.spk').findOne({
        where: { id },
      });

      if (!existingSpk) {
        ctx.status = 404;
        return ctx.body = { error: 'SPK not found' };
      }

      if (!existingSpk.isEditable) {
        ctx.status = 403;
        return ctx.body = { error: 'SPK is not editable' };
      }

      const response = await super.update(ctx);
      return response;
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        error: error.message,
        details: 'Failed to update SPK'
      };
    }
  }
}));