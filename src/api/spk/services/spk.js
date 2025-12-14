'use strict';

/**
 * spk service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::spk.spk', ({ strapi }) => ({
  // Custom method to get SPK statistics
  async getStatistics() {
    const spks = await strapi.query('api::spk.spk').findMany({
      populate: ['sales', 'branch', 'vehicleType']
    });

    const stats = {
      total: spks.length,
      onProgress: spks.filter(spk => spk.status === 'ON PROGRESS').length,
      finished: spks.filter(spk => spk.status === 'FINISH').length,
      byBranch: {},
      bySales: {},
      byVehicleType: {}
    };

    // Group by branch
    spks.forEach(spk => {
      const branchName = spk.branch?.name || 'Unknown';
      stats.byBranch[branchName] = (stats.byBranch[branchName] || 0) + 1;
    });

    // Group by sales
    spks.forEach(spk => {
      const salesName = spk.sales?.fullName || spk.sales?.username || 'Unknown';
      stats.bySales[salesName] = (stats.bySales[salesName] || 0) + 1;
    });

    // Group by vehicle type
    spks.forEach(spk => {
      const vehicleName = spk.vehicleType?.name || 'Unknown';
      stats.byVehicleType[vehicleName] = (stats.byVehicleType[vehicleName] || 0) + 1;
    });

    return stats;
  },

  // Custom method to find SPK by date range
  async findByDateRange(startDate, endDate) {
    return await strapi.query('api::spk.spk').findMany({
      where: {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      },
      populate: ['sales', 'branch', 'vehicleType'],
      sort: { createdAt: 'desc' }
    });
  }
}));