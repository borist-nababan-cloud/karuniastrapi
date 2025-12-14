'use strict';

/**
 * attendance service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::attendance.attendance', ({ strapi }) => ({
  // Custom method to get attendance statistics
  async getStatistics(userId = null, branchId = null, date = null) {
    const where = {};

    if (userId) where.user = userId;
    if (branchId) where.branch = branchId;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.timestamp = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    const attendances = await strapi.query('api::attendance.attendance').findMany({
      where,
      populate: ['user', 'branch']
    });

    const stats = {
      total: attendances.length,
      checkIns: attendances.filter(att => att.type === 'Check-In').length,
      tracking: attendances.filter(att => att.type === 'Tracking').length,
      uniqueUsers: [...new Set(attendances.map(att => att.user.id))].length
    };

    return stats;
  },

  // Method to check if user has checked in today
  async hasCheckedInToday(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkIn = await strapi.query('api::attendance.attendance').findOne({
      where: {
        user: userId,
        type: 'Check-In',
        timestamp: {
          $gte: today,
          $lt: tomorrow
        }
      }
    });

    return !!checkIn;
  },

  // Method to get attendance by date range for reporting
  async getAttendanceReport(startDate, endDate, userId = null, branchId = null) {
    const where = {
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (userId) where.user = userId;
    if (branchId) where.branch = branchId;

    return await strapi.query('api::attendance.attendance').findMany({
      where,
      populate: ['user', 'branch'],
      sort: { timestamp: 'desc' }
    });
  }
}));