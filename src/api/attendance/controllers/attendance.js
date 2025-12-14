'use strict';

/**
 * attendance controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::attendance.attendance', ({ strapi }) => ({
  // Custom method to get attendance by user
  async findByUser(ctx) {
    try {
      const { userId } = ctx.params;
      const attendances = await strapi.query('api::attendance.attendance').findMany({
        where: {
          user: userId
        },
        populate: ['user', 'branch'],
        sort: { timestamp: 'desc' }
      });

      ctx.send({ data: attendances });
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        error: error.message,
        details: 'Failed to fetch attendances'
      };
    }
  },

  // Custom method to get today's attendance
  async findToday(ctx) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const attendances = await strapi.query('api::attendance.attendance').findMany({
        where: {
          timestamp: {
            $gte: today,
            $lt: tomorrow
          }
        },
        populate: ['user', 'branch'],
        sort: { timestamp: 'desc' }
      });

      ctx.send({ data: attendances });
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        error: error.message,
        details: 'Failed to fetch today\'s attendances'
      };
    }
  }
}));